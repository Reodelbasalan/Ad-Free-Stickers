#!/usr/bin/env bash
# Put an animated sticker on top of a video.
# Usage: ./scripts/add-sticker.sh -i VIDEO -s STICKER.png [options] -o OUT.mp4
#
# Options:
#   -i FILE    input video (required)
#   -s FILE    sticker PNG (transparent) — e.g. stickers/png/social/subscribe.png (required)
#   -o FILE    output video (required)
#   -p POS     position: center top bottom left right top-left top-right bottom-left bottom-right
#              or exact pixels "X,Y" (center of the sticker). Default: bottom-right
#   -w SIZE    sticker width as part of the video width, 0.05-1.0 (default: 0.3)
#   -a ANIM    animation: pop fade slide-left slide-right slide-up slide-down bounce float
#              wiggle spin pulse shake none (default: pop)
#   -t START   when the sticker appears, in seconds (default: 0)
#   -e END     when it disappears, in seconds (default: end of video)
#
# Add many stickers: run it again on the output, e.g.
#   ./scripts/add-sticker.sh -i v.mp4 -s like.png -p top-left -o step1.mp4
#   ./scripts/add-sticker.sh -i step1.mp4 -s wow.png -a bounce -t 2 -e 5 -o final.mp4
set -euo pipefail

IN=""; ST=""; OUT=""; POS="bottom-right"; SIZE="0.3"; ANIM="pop"; START="0"; END=""
die() { echo "❌ $*" >&2; exit 1; }
usage() { sed -n '2,23p' "$0" | sed 's/^# \{0,1\}//'; exit 1; }
while getopts "i:s:o:p:w:a:t:e:h" o; do
  case $o in i) IN=$OPTARG;; s) ST=$OPTARG;; o) OUT=$OPTARG;; p) POS=$OPTARG;; w) SIZE=$OPTARG;;
             a) ANIM=$OPTARG;; t) START=$OPTARG;; e) END=$OPTARG;; *) usage;; esac
done
[[ -z "$IN" || -z "$ST" || -z "$OUT" ]] && usage
command -v ffmpeg >/dev/null && command -v ffprobe >/dev/null || die "Walang FFmpeg. I-install muna: https://ffmpeg.org/download.html"
[[ -f "$IN" ]] || die "Hindi makita ang video: $IN"
[[ -f "$ST" ]] || die "Hindi makita ang sticker: $ST"
[[ "$IN" -ef "$OUT" ]] && die "Iba dapat ang output file sa input."
isnum() { [[ "$1" =~ ^[0-9]+([.][0-9]+)?$ ]]; }
isnum "$SIZE" && isnum "$START" || die "Mali ang -w o -t (dapat numero)."
[[ -z "$END" ]] || isnum "$END" || die "Mali ang -e (dapat numero)."

IFS=x read -r W H < <(ffprobe -v error -select_streams v:0 -show_entries stream=width,height -of csv=p=0:s=x "$IN")
[[ -n "${W:-}" ]] || die "Walang video stream sa $IN"
DUR=$(ffprobe -v error -show_entries format=duration -of default=nw=1:nk=1 "$IN")
FPS=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of default=nw=1:nk=1 "$IN")
IFS=x read -r IW IH < <(ffprobe -v error -show_entries stream=width,height -of csv=p=0:s=x "$ST")
[[ -z "$END" ]] && END=$DUR
calc() { awk "BEGIN{printf \"%.4f\", $*}"; }
END=$(calc "($END > $DUR) ? $DUR : $END")
awk -v s="$START" -v e="$END" 'BEGIN{exit !(e > s)}' || die "Dapat mas malaki ang -e kaysa -t (at nasa loob ng video)."

SW=$(calc "int($W * $SIZE / 2) * 2"); SH=$(calc "int($SW * $IH / $IW / 2) * 2")
SW=${SW%.*}; SH=${SH%.*}
M=$(calc "int(($W < $H ? $W : $H) * 0.05)"); M=${M%.*}

# anchor = where the CENTER of the sticker goes
case "$POS" in
  center)       CX=$((W/2));            CY=$((H/2));;
  top)          CX=$((W/2));            CY=$((M + SH/2));;
  bottom)       CX=$((W/2));            CY=$((H - M - SH/2));;
  left)         CX=$((M + SW/2));       CY=$((H/2));;
  right)        CX=$((W - M - SW/2));   CY=$((H/2));;
  top-left)     CX=$((M + SW/2));       CY=$((M + SH/2));;
  top-right)    CX=$((W - M - SW/2));   CY=$((M + SH/2));;
  bottom-left)  CX=$((M + SW/2));       CY=$((H - M - SH/2));;
  bottom-right) CX=$((W - M - SW/2));   CY=$((H - M - SH/2));;
  *,*)          CX=${POS%,*}; CY=${POS#*,}; [[ "$CX$CY" =~ ^[0-9]+$ ]] || die "Mali ang -p '$POS'. Halimbawa: 640,360";;
  *)            die "Mali ang -p '$POS'. Tingnan: ./scripts/add-sticker.sh -h";;
esac

S=$START; E=$END
P="clip((t-$S)/0.45,0,1)"                       # 0→1 entrance progress
Q="clip(($E-t)/0.3,0,1)"                        # 1→0 exit progress
BACK="(1+2.70158*pow($P-1,3)+1.70158*pow($P-1,2))"  # overshoot "pop"
EASE="(1-pow(1-$P,3))"
K="1"; ROT=""; DX="0"; DY="0"; FADE=1
case "$ANIM" in
  pop)         K="$BACK*$Q"; FADE=0;;
  fade)        ;;
  slide-left)  DX="-($CX+$SW)*(1-$EASE)";;
  slide-right) DX="($W-$CX+$SW)*(1-$EASE)";;
  slide-up)    DY="($H-$CY+$SH)*(1-$EASE)";;
  slide-down)  DY="-($CY+$SH)*(1-$EASE)";;
  bounce)      K="$BACK*$Q"; DY="-abs(sin((t-$S)*PI*1.6))*$SH*0.18"; FADE=0;;
  float)       DY="sin((t-$S)*2.5)*$SH*0.07";;
  wiggle)      ROT="0.16*sin((t-$S)*11)";;
  spin)        ROT="(t-$S)*PI";;
  pulse)       K="(1+0.09*sin((t-$S)*PI*3))*$BACK*$Q"; FADE=0;;
  shake)       DX="sin(t*53)*$SW*0.03"; DY="cos(t*47)*$SH*0.03";;
  none)        FADE=0;;
  *) die "Walang animation na '$ANIM'. Pagpipilian: pop fade slide-left slide-right slide-up slide-down bounce float wiggle spin pulse shake none";;
esac

F="[1:v]format=rgba"
if [[ "$K" == "1" ]]; then F+=",scale=${SW}:${SH}"
else F+=",scale=w='max(2,trunc($SW*($K)/2)*2)':h='max(2,trunc($SH*($K)/2)*2)':eval=frame"; fi
[[ -n "$ROT" ]] && F+=",rotate=a='$ROT':c=none:ow='hypot(iw,ih)':oh='hypot(iw,ih)'"
if [[ $FADE == 1 ]]; then
  FO=$(calc "($E - 0.3 > $S) ? $E - 0.3 : $S")
  F+=",fade=t=in:st=$S:d=0.3:alpha=1,fade=t=out:st=$FO:d=0.3:alpha=1"
fi
F+="[st];[0:v][st]overlay=x='$CX-w/2+($DX)':y='$CY-h/2+($DY)':enable='between(t,$S,$E)':eof_action=pass:format=auto,format=yuv420p[v]"

mkdir -p "$(dirname "$OUT")"
ffmpeg -y -hide_banner -loglevel error -i "$IN" -framerate "$FPS" -loop 1 -t "$DUR" -i "$ST" \
  -filter_complex "$F" -map "[v]" -map "0:a?" -c:a copy \
  -c:v libx264 -preset medium -crf 18 -movflags +faststart -t "$DUR" "$OUT" \
  || die "Nag-fail ang FFmpeg."
echo "✅ Done: $OUT  (sticker: $(basename "$ST"), $ANIM, ${S}s–${E}s, $POS)"
