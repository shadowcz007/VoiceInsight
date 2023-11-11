import faster_whisper

# import tkinter as tk
# from tkinter import filedialog

import os,time
# import asyncio
import arrow
# import signal
# import sys

from fastapi import FastAPI,  Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
# import threading

from ffmpeg import Progress
from ffmpeg.asyncio import FFmpeg

app = FastAPI()
# import youtube_dl

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Set the appropriate origins that are allowed to access your API
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

global model_path,file_path,model

#设置whisper模型路径
def set_path(modelpath):
    global model_path,model,path_label
    model_path = modelpath
    if model_path:
        print('设置whisper模型路径',model_path)
        model = faster_whisper.WhisperModel(model_path)
        return True

# def select_file(fp):
#     global file_path,file_label
#     file_path=asyncio.run(extract_audio(fp))
#     print("文件路径：{}".format(file_path))

def run_model():
    # 在这里添加运行模型的代码
    global file_path,model
    subtitle=""
    if model:
        segments, info = model.transcribe(file_path, beam_size=5,vad_filter=True)

        info_print="Detected language '%s' with probability %f" % (info.language, info.language_probability)
        print(info_print)
        
        # for segment in segments:
        #     for word in segment.words:
        #         w_print="[%.2fs -> %.2fs] %s" % (word.start, word.end, word.word)
        #         info_print+='\n'+w_print
        #         print(w_print)

        v_dir = os.path.dirname(file_path)
        v_filename = os.path.basename(file_path)
        
        # 设置输出音频文件的路径和文件名
        txt_filename = os.path.splitext(v_filename)[0] + '.txt'
        txt_path = os.path.join(v_dir, txt_filename)

        txt2_filename = os.path.splitext(v_filename)[0] + '_2.txt'
        txt2_path = os.path.join(v_dir, txt2_filename)
        
        subtitle=save(segments,txt_path,txt2_path)
        
        return subtitle

async def extract_audio(video_path):
    # 获取视频文件所在目录和文件名
    video_dir = os.path.dirname(video_path)
    video_filename = os.path.basename(video_path)
    
    # 设置输出音频文件的路径和文件名
    audio_filename = os.path.splitext(video_filename)[0] + '.mp3'
    audio_path = os.path.join(video_dir, audio_filename)
    if os.path.exists(audio_path):
        return audio_path
    # 使用ffmpeg提取音频
    ffmpeg = (
        FFmpeg()
        # .option("y")
        .input(video_path)
        .output(audio_path,format='mp3')
    )

    @ffmpeg.on("progress")
    def time_to_terminate(progress: Progress):
        if progress.frame > 200:
            ffmpeg.terminate()

    await ffmpeg.execute()

    # 返回音频文件的路径
    return audio_path



def save(segments,output_file,txt2_path,actual_start_time=None):
    # 提取字幕
    subtitles = []
    
    # 提取文本
    texts=[]

    start_time = arrow.get(actual_start_time, 'HH:mm:ss.SSS') if actual_start_time is not None else arrow.get(0)

    for segment in segments:
        # 计算开始时间和结束时间
        start = format_time(start_time.shift(seconds=segment.start))
        end = format_time(start_time.shift(seconds=segment.end))
        # 构建字幕文本
        text=segment.text
        subtitle_text = f"[{start} -> {end}]: {text}"
        print(subtitle_text)
        subtitles.append(subtitle_text)
        texts.append(text)
    
    # 将字幕文本写入到指定文件中
    with open(output_file, "w", encoding="utf-8") as f:
        for subtitle in subtitles:
            f.write(subtitle + "\n")

    with open(txt2_path, "w", encoding="utf-8") as f:
        for text in texts:
            f.write(text + "\n")

    return "\n".join(subtitles)
 
def format_time(time):
    return time.format('HH:mm:ss.SSS')


@app.post("/transcribe")
async def transcribe(
    filepath:str = Body(...,embed=True)):
    global file_path
    file_path = await extract_audio(filepath)
    subtitle=run_model()
    return {"result":subtitle}

@app.post("/setup")
async def transcribe(
    modelpath:str = Body(...,embed=True),
    ):
    result=False
    if modelpath:
        result=set_path(modelpath)
    return {"result":result}

@app.get("/")
async def root():
    return {"message": "Welcome to VoiceInsight API"}

def run_web_service():
    import sys
    import uvicorn
    port = 6678

    # Parse command line arguments
    for arg in sys.argv[1:]:
        if arg.startswith("port="):
            port = int(arg.split("=")[1])

    if port is not None:
        print("Received port argument:", port)
    else:
        print("No port argument provided")

    uvicorn.run(app, host="127.0.0.1", port=port)

if __name__ == "__main__":
    run_web_service()

