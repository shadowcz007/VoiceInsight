@echo off
python -m venv env
echo Activating virtual environment...
env\Scripts\python -s -m pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
env\Scripts\python -s -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
env\Scripts\activate