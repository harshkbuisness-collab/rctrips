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
3. Choose the Speed:
     Fast    = over 2x faster. Feeling tags are ignored (the voice still has feeling
               from its voice sample). Good for most videos.
     Quality = slower, but the [excited] / [sarcastic] ... tags work.
4. Click "Make all voices". The orange bar shows how much is done and the TIME LEFT
   (the estimate gets accurate after the first few sentences).
   Every finished script appears below right away: pick it in "Listen to" to play it,
   and download its files, while the rest keep being made.
5. Your files are also in the "output" folder (and as one download: all_voices.zip):
     script_01.wav  = the voice
     script_01.json = the timing of every sentence (send this too, it lets
                      Claude build the video without re-making the voice)

GOOD TO KNOW
- SPEED. On a normal laptop: Fast mode needs about 2 minutes of work per 1 minute of
  voice, Quality about 4-5. A graphics card (GPU) is many times faster:
    * Own NVIDIA card: the installer uses it automatically.
    * No card? Use Google's free GPU: open VoiceStudio_Colab.ipynb at
      https://colab.research.google.com (File > Upload notebook) and follow the 3 steps
      written at its top. You get the same page through a "gradio.live" link.
- If you stop it, just start again with the same scripts: finished sentences
  are remembered (in the "cache" folder) and it continues where it stopped.
- Don't like a take? Change "Take number" to 2, 3, ... and run again.
- The voice is computer-made. It carries a silent watermark from the model maker
  (Resemble AI, MIT licence), which is normal and fine for YouTube.
