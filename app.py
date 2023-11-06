import faster_whisper

import tkinter as tk
from tkinter import filedialog

import os,time
import asyncio
import arrow
import signal
import sys

from fastapi import FastAPI,  Request, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import threading

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


global model_path,file_path,model,path_label,file_label,result_label


def set_path():
    global model_path,model,path_label
    model_path = filedialog.askdirectory()
    if model_path:
        path_label.config(text="路径：{}".format(model_path))
        model = faster_whisper.WhisperModel(model_path)

def select_file():
    global file_path,file_label
    fp = filedialog.askopenfilename()
    
    file_path=asyncio.run(extract_audio(fp))
    file_label.config(text="文件路径：{}".format(file_path))

def run_model():
    # 在这里添加运行模型的代码
    global file_path,model,result_label

    segments, info = model.transcribe(file_path, beam_size=5,vad_filter=True)

    info_print="Detected language '%s' with probability %f" % (info.language, info.language_probability)
    print(info_print)
    result_label.config(text=info_print)
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
    result_label.config(text=subtitle)
    
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




@app.get("/")
async def root():
    return {"message": "Welcome to VoiceInsight API"}

def run_web_service():
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=6678)


def run_gui():
    global path_label,file_label,result_label

    def on_closing():
        window.destroy()
    
    # 创建主窗口
    window = tk.Tk()
    window.protocol("WM_DELETE_WINDOW", on_closing)
    window.title("VoiceInsight")
    window.configure(bg="#f2f2f2") # 设置窗口背景色
    window.option_add("*Font", "Arial 12") # 设置全局字体样式


    # 设置路径按钮
    set_path_button = tk.Button(window, text="设置whisper模型路径", command=set_path,bg="#4CAF50", fg="white", relief="flat")
    set_path_button.pack()

    # 显示路径的信息栏
    path_label = tk.Label(window, text="路径：", bg="#f2f2f2", font=("Arial", 12))
    path_label.pack()


    # URL输入框
    # url_entry = tk.Entry(window)
    # url_entry.insert(0, "请输入YouTube URL") # 添加提示文字
    # url_entry.pack(pady=10)

    # 获取URL的按钮
    # get_url_button = tk.Button(window, text="获取视频URL", command=get_url)
    # get_url_button.pack()


    # 选择文件按钮
    select_file_button = tk.Button(window, text="选择视频or音频文件", command=select_file,bg="#4CAF50", fg="white", relief="flat")
    select_file_button.pack()

    # 显示文件路径的信息栏
    file_label = tk.Label(window, text="文件路径：", bg="#f2f2f2", font=("Arial", 12))
    file_label.pack()

    # 运行模型按钮
    run_model_button = tk.Button(window, text="运行模型", command=run_model,bg="#4CAF50", fg="white", relief="flat")
    run_model_button.pack()

    # 显示模型运行结果的区域
    result_label = tk.Label(window, text="", bg="#f2f2f2", font=("Arial", 12), fg="#4CAF50")
    result_label.pack()

    #调整部件的布局
    set_path_button.pack(pady=10)
    path_label.pack(pady=5)
    select_file_button.pack(pady=10)
    file_label.pack(pady=5)
    run_model_button.pack(pady=10)
    result_label.pack(pady=5)

    # 进入主循环
    window.mainloop()


if __name__ == "__main__":
    web_service_thread = threading.Thread(target=run_web_service)
    web_service_thread.start()

    gui_thread = threading.Thread(target=run_gui)
    gui_thread.start()

    web_service_thread.join()
    gui_thread.join()

