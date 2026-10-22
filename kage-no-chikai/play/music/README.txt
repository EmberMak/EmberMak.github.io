Optional soundtrack. Put audio files in this folder and create tracks.json listing them, e.g.
{"title":"title.ogg","map":"map.ogg","duel":"duel.mp3","boss":"boss.ogg","victory":"victory.ogg","death":"death.ogg"}
Any subset works (boss falls back to duel, map to title). Tracks loop and cross-fade between scenes; the synthesized in-game music mutes itself while a track plays.
