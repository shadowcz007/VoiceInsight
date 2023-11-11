# VoiceInsight

python -m venv env

env/Scripts/python -s -m pip install faster-whisper -i https://pypi.tuna.tsinghua.edu.cn/simple
env/Scripts/python -s -m pip install pyinstaller -i https://pypi.tuna.tsinghua.edu.cn/simple
env/Scripts/python -s -m pip install python-ffmpeg -i https://pypi.tuna.tsinghua.edu.cn/simple
env/Scripts/python -s -m pip install arrow

<!-- bark -->
env/Scripts/python -s -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
env/Scripts/python -s -m pip install transformers -i https://pypi.tuna.tsinghua.edu.cn/simple
env/Scripts/python -s -m pip install scipy -i https://pypi.tuna.tsinghua.edu.cn/simple
env/Scripts/python -s -m pip install optimum -i https://pypi.tuna.tsinghua.edu.cn/simple
env/Scripts/python -s -m pip install accelerate -i https://pypi.tuna.tsinghua.edu.cn/simple


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
pyinstaller -F whisper.py --add-data "env\Lib\site-packages\faster_whisper\assets\silero_vad.onnx:faster_whisper/assets" --clean