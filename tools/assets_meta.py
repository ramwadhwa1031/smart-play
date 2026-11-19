# Single source of truth for how each uploaded file is classified.
# idx = order printed by tools/scan.py (sorted: root jpegs, then zip-folder jpegs, then docx image)
# cats: classroom, events, celebrations, creative, outdoor, infra
SELECTED = [
 # idx, slug, category, caption, alt
 (2,"christmas-decor","celebrations","Christmas celebration decor","Christmas decor with Santa cut-outs, a snowman and a tree at Smart Start"),
 (3,"ganesh-chaturthi-shrine","celebrations","Ganesh Chaturthi celebration","Child wearing a Ganesha mask beside a marigold-decorated shrine"),
 (4,"independence-day-salute","celebrations","A little patriot salutes","Child in a tricolour outfit saluting in front of an Independence Day backdrop"),
 (5,"folk-dhol-celebration","celebrations","Folk celebration with a dhol","Children in traditional attire with a dhol at a Smart Start celebration"),
 (6,"costume-day-with-teacher","celebrations","Costume day with a teacher","Teacher kneeling beside a child in a colourful costume holding a certificate"),
 (7,"jungle-nature-corner","creative","Jungle-themed nature corner","Two children exploring a jungle-themed corner with a paper tree and a potted plant"),
 (9,"admissions-desk-event","events","Admissions desk at a community event","Smart Start admissions desk with a group of visiting professionals"),
 (10,"festival-costume-swing","celebrations","Festival costume portrait","Girl in a red and white festival costume on a decorated swing"),
 (11,"janmashtami-tableau","celebrations","Janmashtami tableau","Children in mythological costumes seated on a decorated Janmashtami set"),
 (12,"little-santas","celebrations","Little Santas with their teacher","Teacher with children dressed as Santa Claus on a pink stage"),
 (13,"krishna-costume-girl","celebrations","Dressed for Janmashtami","Girl in a colourful costume in front of a Krishna-themed backdrop"),
 (15,"lohri-celebration","celebrations","Lohri celebration","Lohri decor with a bonfire model, balloons and marigold garlands"),
 (17,"graduation-with-family","events","Graduation day with family","Child in a blue graduation gown with parents and a family member"),
 (18,"graduation-day","events","Graduation day","Child in a blue graduation gown holding a scroll and a certificate"),
 (19,"swing-play-outdoors","outdoor","Playing together outdoors","Two children in yellow outfits playing outdoors under marigold garlands"),
 (20,"learning-with-sound-book","classroom","Learning with a sound book","Boy touching an interactive alphabet sound book at his desk"),
 (21,"toddler-ring-stacking","classroom","Toddler ring-stacking play","Toddler playing with stacking rings and hoops on a soft play mat"),
 (22,"summer-camp-welcome","events","Summer Camp","Teacher holding a toddler beneath a colourful Summer Camp sign"),
 (23,"mango-cart-roleplay","creative","Mango cart role-play","Two children at a decorated mango cart with paper trees"),
 (24,"ball-pit-adventure","infra","Ball pit and climbing wall","Child playing in a ball pit in front of a mountain-themed climbing wall"),
 (25,"classroom-group-circle","classroom","Our little learners with their teacher","Teacher seated with a group of children in blue uniforms in a themed classroom"),
 (26,"climbing-net-smile","infra","Climbing net challenge","Smiling child climbing a net on a mountain-themed climbing wall"),
 (27,"independence-day-flag","celebrations","Waving the tricolour","Child in school uniform holding a small Indian flag"),
 (28,"mehndi-corner","celebrations","Mehndi and Choodi corner","Teacher applying mehndi to a child at a decorated Mehndi Corner"),
 (30,"hariyali-teej-swing","celebrations","Hariyali Teej swing","Two children on a flower-decorated swing for Hariyali Teej"),
 (31,"india-day-group","celebrations","Independence Day group","Teachers and children seated together at an Independence Day set"),
 (32,"india-day-costumes","celebrations","Independence Day costumes","Children dressed as freedom fighters in front of an India-themed backdrop"),
 (33,"independence-worksheet","creative","Independence Day worksheet time","Girl pointing at an Independence Day activity worksheet at her desk"),
 (34,"raksha-bandhan-pair","celebrations","Raksha Bandhan sweetness","Two toddlers in front of a Happy Raksha Bandhan backdrop"),
 (35,"rakhi-tying","celebrations","Tying the rakhi","Toddler girl placing a tilak on a toddler boy for Raksha Bandhan"),
 (36,"krishna-radha-portrait","celebrations","Krishna and Radha","Two children dressed as Krishna and Radha"),
 (37,"janmashtami-prison-set","celebrations","Janmashtami storytelling set","Girl in traditional dress beside a Janmashtami storytelling set"),
 (38,"krishna-flute","celebrations","Janmashtami flute","Child dressed as Krishna playing a flute beside a child dressed as Radha"),
 (39,"outdoor-hoop-game","outdoor","Hoop-and-basket game","Child stepping through hoops on outdoor grass while a teacher holds a hoop"),
 (40,"dandiya-pair","celebrations","Dandiya pair","Two children in festive outfits holding dandiya sticks"),
 (41,"ball-pit-slide","infra","Ball pit and slide","Child sliding into a ball pit in the play area"),
 (42,"birthday-cake","celebrations","Birthday celebration","Child with parents about to cut a birthday cake"),
 (43,"toddler-cups-outdoors","outdoor","Stacking cups on the grass","Toddler stacking colourful cups on artificial grass outdoors"),
 (44,"finger-painting","creative","Finger painting grapes","Boy finger-painting grapes on an activity sheet"),
 (45,"annual-day-play","events","Annual day performance","Teachers and children performing a village-themed play on stage"),
 (46,"annual-day-dance","events","Dance on stage","Parents and a toddler dancing together on the annual day stage"),
 (47,"annual-day-felicitation","events","Felicitation on stage","Teachers and parents with children receiving mementos on stage"),
 (48,"martial-arts-line-up","events","Martial arts demonstration","Children in white martial-arts uniforms lined up on stage"),
 (49,"annual-day-audience","events","Cheering audience","Parents in the audience waving and clapping at a Smart Start show"),
 (51,"fashion-show-ramp","events","Fashion show ramp","Decorated red-carpet ramp with blue and gold balloons for a fashion show"),
 (52,"fashion-show-walk","events","Fashion show walk","Teacher guiding a child down a balloon-lined ramp in the play hall"),
 (53,"halloween-entrance","celebrations","Halloween entrance","Halloween-themed entrance arch at the school gate"),
 (55,"play-prepare-pride-stage","events","Play. Prepare. Pride.","Children in martial-arts uniforms on stage under a Play Prepare Pride banner"),
 (56,"felicitation-family","events","Family felicitation","Parents and children with a trophy in front of the Smart Start banner"),
 (57,"stage-costume-trio","events","Costume parade","Three children in costumes on a stage with silver tinsel curtains"),
 (58,"stage-costume-group","events","Costume parade with teachers","Children in mythological costumes with teachers on stage"),
 (59,"stage-bunny-ears","events","Little bunnies on stage","Children in sparkly outfits and bunny ears with teachers on stage"),
 (60,"stage-teachers-and-kids","events","Teachers and children on stage","Teachers holding hands with children on stage"),
 (61,"stage-blue-curtain-guests","events","Guests on the blue stage","Teachers and guests with a lotus decoration on a blue-curtained stage"),
 (62,"stage-speaker","events","On the mic","Teacher and guest speaking on stage at a school event"),
 (63,"stage-guest-lineup","events","Chief guests on stage","Guests lined up on stage holding mementos"),
 (64,"stage-waiting-turn","events","Waiting for the turn","Two children in yellow tracksuits sitting on stage chairs with a teacher"),
]
LOGO_IDX = 0
PATTERN_IDX = 1
BANNER_IDX = 65
PRINCIPAL_IDX = 66   # docx image, same photo placed in "Dear Parents" letter

# Not used on the public site and why
EXCLUDED = {
 8:"Near-duplicate of #7 (same jungle corner, different child)",
 14:"Out-of-focus close-up of a decorated pot; poor composition",
 16:"Near-duplicate of #15 (same Lohri set)",
 29:"Near-duplicate of #28 (same Mehndi corner)",
 50:"Phone screenshot with black letterbox bars; low resolution",
 54:"Instagram screenshot with UI chrome; low resolution",
}

CATEGORIES = [
 {"id":"classroom","label":"Classroom Activities"},
 {"id":"events","label":"Events"},
 {"id":"celebrations","label":"Celebrations"},
 {"id":"creative","label":"Creative Learning"},
 {"id":"outdoor","label":"Outdoor Activities"},
 {"id":"infra","label":"School Infrastructure"},
]

