VIDEO ANALYZER - check any video (yours or a reference) without spending Claude credits
=======================================================================================
ONE-TIME SETUP: install Python 3.11 (python.org, tick "Add to PATH"), then double-click
1_INSTALL_windows.bat (Mac: 1_INSTALL_mac.command). Also install ffmpeg (the window tells you how).

EVERY TIME: Windows: double-click 2_ANALYZE_drag_video_here_windows.bat and choose one or MANY videos
(Ctrl+click each, or Ctrl+A for all). Many videos also give ALL_REPORTS.md: paste that one file into Claude.
(or drag the video onto it). A black window shows progress; a box says "Done!" at the end.
Mac: double-click 2_ANALYZE_mac.command and drag the video into the window.
A folder <video name>_analysis appears next to the video:
  REPORT.md       -> copy ALL of it into Claude (this is all Claude needs)
  transcript.txt  -> send only if Claude asks
  sheet.jpg       -> 24 small frames, send only if Claude asks
A 14-minute video takes a few minutes.

SCENE PICTURES (new)
Double-click 3_SCENES_drag_video_here_windows.bat (Mac: 3_SCENES_mac.command), choose one or more videos.
Next to each video you get a folder <name>_scenes with one picture per scene (scene_001_0m05s.jpg ...)
and ALL_SCENES.jpg (all scenes on one page, with times). Change pictures inside long scenes: --every 5
