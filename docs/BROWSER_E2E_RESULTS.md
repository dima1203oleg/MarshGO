# Browser E2E results

Playwright (Chromium 1243, isolated Site preview on `:7788` proxying the canonical Server on `:3003`) drives the real UI: type origin → type destination → choose date → search → count rendered route cards.

Result: **31/40 corridors render route cards**.

```
kyiv-city -> lviv: cards=2 empty=false 
lviv -> kyiv-city: cards=10 empty=false 
kyiv-city -> kharkiv: cards=6 empty=false 
kharkiv -> kyiv-city: cards=8 empty=false 
kyiv-city -> odesa: cards=8 empty=false 
odesa -> kyiv-city: cards=5 empty=false 
kyiv-city -> dnipro: cards=7 empty=false 
dnipro -> kyiv-city: cards=9 empty=false 
kyiv-city -> zakarpattia: cards=8 empty=false 
zakarpattia -> kyiv-city: cards=12 empty=false 
kyiv-city -> chernivtsi: cards=7 empty=false 
chernivtsi -> kyiv-city: cards=3 empty=false 
lviv -> zakarpattia: cards=11 empty=false 
ivano-frankivsk -> lviv: cards=8 empty=false 
kharkiv -> dnipro: cards=0 empty=true 
odesa -> mykolaiv: cards=0 empty=true 
kyiv-city -> vinnytsia: cards=7 empty=false 
kyiv-city -> poltava: cards=4 empty=false 
kyiv-city -> rivne: cards=7 empty=false 
kyiv-city -> ternopil: cards=7 empty=false 
kyiv-city -> khmelnytskyi: cards=7 empty=false 
kyiv-city -> cherkasy: cards=0 empty=true 
kyiv-city -> zhytomyr: cards=0 empty=true 
kyiv-city -> chernihiv: cards=0 empty=true 
kyiv-city -> sumy: cards=7 empty=false 
kyiv-city -> zaporizhzhia: cards=7 empty=false 
kyiv-obl -> lviv: cards=10 empty=false 
kyiv-city -> kyiv-obl: cards=0 empty=true 
kyiv-city -> donetsk: cards=0 empty=true 
kyiv-city -> kherson: cards=0 empty=true 
kyiv-city -> mykolaiv: cards=0 empty=true 
dnipro -> ivano-frankivsk: cards=1 empty=false 
ivano-frankivsk -> kharkiv: cards=1 empty=false 
dnipro -> rivne: cards=1 empty=false 
dnipro -> zakarpattia: cards=1 empty=false 
kharkiv -> zakarpattia: cards=1 empty=false 
odesa -> kharkiv: cards=1 empty=false 
zakarpattia -> odesa: cards=5 empty=false 
lviv -> zaporizhzhia: cards=3 empty=false 
rivne -> zaporizhzhia: cards=3 empty=false 
```

Screenshots for each run are stored in `tmp-browser-test/shots/`. Every empty corridor above is one of the diagnosed feed gaps in NATIONAL_TRANSPORT_COVERAGE.md, not a UI failure.
