import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CameraModeState, HeadingFilter, ZoomController, cameraConfig, compassPoint, formatBearing, isUrbanContext, lookAheadShare, normalizeBearing, pitchFor, shortestDelta, targetZoom } from '../src/navigation/cameraEngine';

describe('navigation camera engine', () => {
  it('rotates the short way across 0°/360°', () => {
    assert.equal(shortestDelta(359, 0), 1);
    assert.equal(shortestDelta(0, 359), -1);
    assert.equal(shortestDelta(10, 350), -20);
    assert.equal(shortestDelta(90, 270), 180);
    assert.equal(normalizeBearing(-10), 350);
  });

  it('never makes a full turn when the heading crosses north', () => {
    const filter = new HeadingFilter();
    const previous = filter.update({ gpsCourse: 355, speedKmh: 50 })!;
    const unwrapped: number[] = [filter.unwrapped!];
    for (const course of [358, 2, 5, 8, 12]) { filter.update({ gpsCourse: course, speedKmh: 50 }); unwrapped.push(filter.unwrapped!); }
    for (let index = 1; index < unwrapped.length; index++) assert.ok(Math.abs(unwrapped[index] - unwrapped[index - 1]) < 20, 'each step is small, no 350° swing');
    assert.ok(filter.current! < 20 || filter.current! > 340);
    assert.ok(previous > 340);
  });

  it('smooths GPS noise: 87/91/85/93 does not shake the camera', () => {
    const filter = new HeadingFilter();
    filter.update({ gpsCourse: 88, speedKmh: 40 });
    const seen: number[] = [];
    for (const course of [87, 91, 85, 93, 86, 92, 89]) seen.push(filter.update({ gpsCourse: course, speedKmh: 40 })!);
    assert.ok(Math.max(...seen) - Math.min(...seen) < 3, `spread ${Math.max(...seen) - Math.min(...seen)}`);
  });

  it('holds the last stable heading while standing still and ignores a noisy course at low speed', () => {
    const filter = new HeadingFilter();
    filter.update({ gpsCourse: 120, speedKmh: 50 });
    const stable = filter.current;
    for (const course of [10, 200, 300, 45]) filter.update({ gpsCourse: course, speedKmh: 1 });
    assert.equal(filter.current, stable);
    assert.equal(new HeadingFilter().update({ gpsCourse: 77, speedKmh: 0 }), null, 'no heading until something reliable arrives');
    assert.equal(new HeadingFilter().update({ gpsCourse: null, deviceHeading: 200, speedKmh: 0 }), 200, 'device compass seeds the first heading');
  });

  it('maps speed to a sensible zoom: closer when slow and in town, wider on fast roads', () => {
    const zooms = [5, 30, 60, 100].map((speedKmh) => targetZoom({ speedKmh }));
    for (let index = 1; index < zooms.length; index++) assert.ok(zooms[index] < zooms[index - 1], `zoom shrinks with speed: ${zooms}`);
    assert.ok(targetZoom({ speedKmh: 40, urban: true }) > targetZoom({ speedKmh: 40 }));
    assert.ok(targetZoom({ speedKmh: 100 }) < targetZoom({ speedKmh: 100, urban: true }));
    assert.ok(targetZoom({ speedKmh: 50, maneuverDistanceMeters: 150 }) > targetZoom({ speedKmh: 50, maneuverDistanceMeters: 450 }));
    assert.ok(targetZoom({ speedKmh: 50, maneuverDistanceMeters: 450 }) > targetZoom({ speedKmh: 50, maneuverDistanceMeters: 2000 }));
    assert.ok(targetZoom({ speedKmh: 0, urban: true, maneuverDistanceMeters: 50 }) <= cameraConfig.maxZoom);
    assert.ok(targetZoom({ speedKmh: 400 }) >= cameraConfig.minZoom);
  });

  it('does not pump the zoom when the speed wobbles around a threshold', () => {
    const controller = new ZoomController();
    controller.update(targetZoom({ speedKmh: 59 }));
    const trace: number[] = [];
    for (const speed of [61, 59, 62, 58, 60, 61, 59]) trace.push(controller.update(targetZoom({ speedKmh: speed })));
    assert.ok(Math.max(...trace) - Math.min(...trace) < 0.05, 'small speed changes leave the zoom alone');
    for (let index = 0; index < 40; index++) controller.update(targetZoom({ speedKmh: 110 }));
    assert.ok(Math.abs(controller.current! - targetZoom({ speedKmh: 110 })) < 0.05, 'a real change glides to the new zoom');
  });

  it('tilts more with speed within safe limits and keeps more road ahead when fast', () => {
    assert.equal(pitchFor(50, false), 0);
    assert.ok(pitchFor(0, true) >= cameraConfig.pitch.min && pitchFor(300, true) <= cameraConfig.pitch.max);
    assert.ok(pitchFor(90, true) > pitchFor(10, true));
    assert.ok(lookAheadShare(100) > lookAheadShare(0));
  });

  it('switches North Up ⇄ Heading Up, goes manual on touch, and returns by tap or after the timeout', () => {
    const state = new CameraModeState('HEADING_UP');
    assert.equal(state.mode, 'HEADING_UP');
    assert.equal(state.toggleOrientation(), 'NORTH_UP');
    assert.equal(state.mode, 'NORTH_UP');
    state.userInteracted(1000);
    assert.equal(state.mode, 'MANUAL');
    assert.equal(state.orientation, 'NORTH_UP', 'the chosen orientation survives manual mode');
    assert.equal(state.autoReturnDue(1000 + cameraConfig.manualTimeoutMs - 1), false);
    state.userInteracted(9000);
    assert.equal(state.autoReturnDue(1000 + cameraConfig.manualTimeoutMs), false, 'further interaction restarts the clock');
    assert.equal(state.autoReturnDue(9000 + cameraConfig.manualTimeoutMs), true);
    state.returnToNavigation();
    assert.equal(state.mode, 'NORTH_UP');
  });

  it('shows a compass point and degrees, and recognises town driving', () => {
    assert.equal(compassPoint(47), 'NE');
    assert.equal(formatBearing(47), 'NE 047°');
    assert.equal(formatBearing(359.6), 'N 000°');
    assert.equal(isUrbanContext([100, 300, 600, 900, 4000]), true);
    assert.equal(isUrbanContext([2000, 9000]), false);
  });
});
