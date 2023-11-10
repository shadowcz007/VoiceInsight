# from transformers import AutoProcessor, BarkModel
# import scipy
# import torch

# device = "cuda" if torch.cuda.is_available() else "cpu"

# processor = AutoProcessor.from_pretrained("model/bark-small")

# # load in fp16
# model = BarkModel.from_pretrained("model/bark-small").to(device)

# # convert to bettertransformer
# model =  model.to_bettertransformer()

# # enable CPU offload
# model.enable_cpu_offload()

# voice_preset = "v2/zh_speaker_6"

# inputs = processor('''WOMAN:你有没有想过一个未来的城市，高耸入云的摩天大楼和飞行汽车？
# MAN:当然！我想象着一个街道上充满全息显示，机器人帮助我们日常任务的城市。''', voice_preset=voice_preset).to(device)

# audio_array = model.generate(**inputs)
# audio_array = audio_array.cpu().numpy().squeeze()


# sample_rate = model.generation_config.sample_rate
# scipy.io.wavfile.write("bark_out.wav", rate=sample_rate, data=audio_array)


from fastapi import FastAPI, HTTPException,Body
from fastapi.middleware.cors import CORSMiddleware
from transformers import AutoProcessor, BarkModel
import scipy
import torch
import tempfile

app = FastAPI()

# 设置允许跨域请求
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

device = "cuda" if torch.cuda.is_available() else "cpu"

processor = None
model = None
# voice_preset = "v2/zh_speaker_6"
voice_preset = None

def set_model(model_path: str):
    global processor, model
    processor = AutoProcessor.from_pretrained(model_path)
    model = BarkModel.from_pretrained(model_path).to(device)
    model = model.to_bettertransformer()
    model.enable_cpu_offload()

def get_temp_file_path():
    # 生成临时文件路径
    temp_dir = tempfile.gettempdir()
    temp_file_path = tempfile.NamedTemporaryFile(dir=temp_dir, suffix='.wav', delete=False).name
    return temp_file_path

# 初始化模型路径设置
@app.post("/set_model_path")
async def set_model_path(model_path:str = Body(...,embed=True)):
    try:
        set_model(model_path)
        return {"message": "Model path set successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    
@app.post("/set_voice_preset")
async def set_voice_preset(preset:str = Body(...,embed=True)):
    global voice_preset
    voice_preset = preset
    return {"message": "Voice preset set successfully"}
    
@app.post("/generate_audio")
async def generate_audio(
    text:str = Body(...,embed=True)):
    try:
        inputs = processor(text, voice_preset=voice_preset).to(device)
        audio_array = model.generate(**inputs)
        audio_array = audio_array.cpu().numpy().squeeze()
        sample_rate = model.generation_config.sample_rate
        file_path = get_temp_file_path()
        scipy.io.wavfile.write(file_path, rate=sample_rate, data=audio_array)
        return {"audio_file": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/")
async def root():
    return {"message": "Welcome to Bark API"}

def run_web_service():
    import sys
    import uvicorn
    port = 65530

    # Parse command line arguments
    for arg in sys.argv[1:]:
        if arg.startswith("port="):
            port = int(arg.split("=")[1])

        if arg.startswith("model="):
            mp=arg.split("=")[1]
            # print(model_path)
            set_model(mp)

    if port is not None:
        print("Received port argument:", port)
    else:
        print("No port argument provided")

    uvicorn.run(app, host="127.0.0.1", port=port)


if __name__ == "__main__":
    run_web_service()