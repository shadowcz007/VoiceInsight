from transformers import AutoProcessor, BarkModel
import scipy
import torch

device = "cuda" if torch.cuda.is_available() else "cpu"

processor = AutoProcessor.from_pretrained("model/bark-small")

# load in fp16
model = BarkModel.from_pretrained("model/bark-small").to(device)

# convert to bettertransformer
model =  model.to_bettertransformer()

# enable CPU offload
model.enable_cpu_offload()

voice_preset = "v2/zh_speaker_6"

inputs = processor('''WOMAN:你有没有想过一个未来的城市，高耸入云的摩天大楼和飞行汽车？
MAN:当然！我想象着一个街道上充满全息显示，机器人帮助我们日常任务的城市。''', voice_preset=voice_preset).to(device)

audio_array = model.generate(**inputs)
audio_array = audio_array.cpu().numpy().squeeze()


sample_rate = model.generation_config.sample_rate
scipy.io.wavfile.write("bark_out.wav", rate=sample_rate, data=audio_array)
