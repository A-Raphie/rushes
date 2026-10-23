// Post-production helper for demo videos.
// HARD RULE: the video always ships CLEAN, no burned captions, ever.
// Subtitles exist on exactly one path: explicitly requested, parsed from the
// VO script, timed against the VO audio, muxed as a SOFT toggleable track.
//
// 1. cuesFromVo(lines, { audioDuration }), spread VO script lines across the
//    audio, weighted by word count (no timestamps in the script, per VO format).
// 2. buildSrt(cues), .srt text for the soft track.
// 3. Command builders: VO mux, soft-subtitle mux, music bed, poster frame.

function tsToSec(ts) {
  const m = String(ts).trim().match(/^(\d+):(\d+(?:\.\d+)?)$/);
  if (!m) throw new Error(`bad timestamp: ${ts} (expected m:ss)`);
  return parseInt(m[1], 10) * 60 + parseFloat(m[2]);
}

// VO script is plain text, one line per spoken beat, no timestamps.
// Audio duration comes from ffprobe on the recorded VO file.
function cuesFromVo(lines, { audioDuration }) {
  const beats = String(lines)
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
  if (!beats.length) throw new Error('VO script has no lines');
  if (!audioDuration || audioDuration <= 0) throw new Error('audioDuration required (ffprobe the VO file)');
  const weights = beats.map((l) => l.split(/\s+/).length);
  const total = weights.reduce((a, b) => a + b, 0);
  let t = 0;
  return beats.map((text, i) => {
    const dur = (weights[i] / total) * audioDuration;
    const cue = { start: t, end: t + dur, text };
    t += dur;
    return cue;
  });
}

function srtTime(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec - Math.floor(sec)) * 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function buildSrt(cues) {
  return cues
    .map((c, i) => `${i + 1}\n${srtTime(c.start)} --> ${srtTime(c.end)}\n${c.text}\n`)
    .join('\n');
}

// ---- ffmpeg post-production commands ----

// Mux the recorded VO under the clean video.
function muxVoCmd({ video, vo, out }) {
  return `ffmpeg -y -i "${video}" -i "${vo}" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest "${out}"`;
}

// Soft subtitle track: toggleable in the player, zero pixels touched.
function muxSubtitlesCmd({ video, srt, out }) {
  return `ffmpeg -y -i "${video}" -i "${srt}" -map 0 -map 1 -c copy -c:s mov_text "${out}"`;
}

// Mix a music bed under the VO: bed sits -18 to -22 dB under the mix,
// fades in/out, ends when the video ends.
function mixMusicCmd({ video, music, out, bedDb = -20 }) {
  return `ffmpeg -y -i "${video}" -i "${music}" -filter_complex "[1:a]volume=${bedDb}dB,afade=t=in:d=1.2,afade=t=out:st=0,apad[m]" -map 0:v -map 0:a -map "[m]" -c:v copy -c:a aac -shortest "${out}"`;
}

// Poster frame at a given second (default: the money moment).
function thumbnailCmd({ video, at = 0, out = 'poster.jpg' }) {
  return `ffmpeg -y -ss ${at} -i "${video}" -frames:v 1 -q:v 2 "${out}"`;
}

module.exports = { tsToSec, cuesFromVo, srtTime, buildSrt, muxVoCmd, muxSubtitlesCmd, mixMusicCmd, thumbnailCmd };
