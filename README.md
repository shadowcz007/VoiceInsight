# VoiceInsight

python -m venv env

env/Scripts/python -s -m pip install faster-whisper -i https://pypi.tuna.tsinghua.edu.cn/simple
env/Scripts/python -s -m pip install pyinstaller -i https://pypi.tuna.tsinghua.edu.cn/simple
env/Scripts/python -s -m pip install python-ffmpeg -i https://pypi.tuna.tsinghua.edu.cn/simple
pip install arrow

<!-- pip install pytube -->
fastapi
uvicorn

### model download
https://huggingface.co/guillaumekln


## 调试
python app.py

cd electron
npm run dev



### 如何打包？
pyinstaller app.py --add-data "env\Lib\site-packages\faster_whisper\assets\silero_vad.onnx:faster_whisper/assets"

