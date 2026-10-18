VOICE STUDIO - make many voice files at once, in the channel's emotional voice
=============================================================================

ONE-TIME SETUP
1. Install Python 3.11 from https://www.python.org/downloads/
   (Windows: tick "Add python.exe to PATH" on the first screen.)
2. Windows: double-click 1_INSTALL_windows.bat
   Mac:     double-click 1_INSTALL_mac.command (if blocked: right-click > Open)
   Wait until it says "Done!" (about 10 minutes).

EVERY TIME
1. Windows: double-click 2_START_windows.bat   Mac: double-click 2_START_mac.command
   Your web browser opens with the Voice Studio page. (The first run downloads the
   voice model, about 3 GB, once.)
2. Paste ALL your scripts in the big box. Put EACH script inside double quotes:

     "[calm] Last week the government put out a report. [excited] Prices are up!"

     "Second script goes here. [sarcastic] Great news, right?"

   - Feelings: [calm] [serious] [sarcastic] [dramatic] [excited] [neutral]
     A feeling lasts until the next tag.
   - Inside a script, use single quotes ' ' only. Double quotes start/end a script.
   - A blank line inside a script = a longer pause.
   - "What the tool found" shows how many scripts it found. Check it before starting.
3. Click "Make all voices". Leave the window open until it says Finished.
4. Your files are in the "output" folder (and as one download: all_voices.zip):
     script_01.wav  = the voice
     script_01.json = the timing of every sentence (send this too, it lets
                      Claude build the video without re-making the voice)

GOOD TO KNOW
- Speed: with an NVIDIA graphics card, about 1 minute of voice per minute.
  Without one (normal laptop or Mac), about 5 minutes of work per 1 minute of voice,
  so 30 long scripts can take many hours. You can leave it running overnight.
- If you stop it, just start again with the same scripts: finished sentences
  are remembered (in the "cache" folder) and it continues where it stopped.
- Don't like a take? Change "Take number" to 2, 3, ... and run again.
- The voice is computer-made. It carries a silent watermark from the model maker
  (Resemble AI, MIT licence), which is normal and fine for YouTube.
