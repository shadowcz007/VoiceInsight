// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import React from "react";
import { useEffect } from "react";
import { Button, ConfigProvider, Input, message, Card, Spin, Progress, Divider } from 'antd';

import {
    CloseOutlined, RedoOutlined, ToolOutlined, StopOutlined
} from '@ant-design/icons';

const hash = require('object-hash');
const { Meta } = Card;

import "./index.css";

import i18n from "i18next";
import { rendererInit } from '../../i18n/config'
rendererInit()

const url = 'http://127.0.0.1'

declare const window: Window &
    typeof globalThis & {
        electron: any
    }

const _shortTitle = (t: string, len: number = 12) => {
    return t ? t.slice(0, len) + (t.length > len ? '...' : '') : ''
}


let mediaRecorder: any;
const recordedChunks: any = [];


function convertToBase64(blob: any) {
    const reader = new FileReader();
    reader.onloadend = () => {
        let r: any = reader?.result
        const base64String = r.split(',')[1];

        window.electron.recordingSaved(base64String);
    };
    reader.readAsDataURL(blob);
}

function handleStream(stream: any) {
    mediaRecorder = new MediaRecorder(stream);

    mediaRecorder.ondataavailable = (event: any) => {
        if (event.data && event.data.size > 0) {
            recordedChunks.push(event.data);
        }
    };

    mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunks, { type: 'audio/mp3' });
        convertToBase64(blob);
        recordedChunks.length = 0;
    };

    mediaRecorder.start();
}

function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder = null;
    }
}

const startRecording = async () => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        handleStream(stream);
    } catch (e) {
        console.error('getUserMedia error:', e);
    }
}



export const App = () => {

    const [info, setInfo]: any = React.useState([]);
    const [modelpath, setModelpath]: any = React.useState(localStorage.getItem('model_path') || '');
    const [subtitle, setSubtitle]: any = React.useState('');
    const [port, setPort]: any = React.useState(49153);
    const [recording, setRecording] = React.useState(false);

    const _close = () => {
        // setInfo([])
        window.electron.pythonApp(true);
    }

    const _api = async () => {
        // setInfo()
        try {
            let res = await fetch(`${url}:${port}`)
            let data = await res.json()
            // console.log(data)
            if (data?.message) {
                setInfo([...info, data.message])
            }
        } catch (error) {
            setInfo([...info, 'No api ' + (new Date()).getTime()]);
            // window.electron.pythonApp();
            // setTimeout(() => _api(), 1000)
        }
    }

    const _setModel = async (openDirectory: boolean = true) => {
        let fp = modelpath;
        if (openDirectory) {
            fp = await window.electron.openDirectory();
        }

        if (fp) {
            // console.log(mp)
            fetch(`${url}:${port}/setup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    modelpath: fp
                })
            })
                .then(response => response.json())
                .then(result => {
                    console.log('POST request successful:', result);
                    if (result.result) {
                        setInfo([...info, `模型加载成功:${fp}`])
                        setModelpath(fp)
                        localStorage.setItem('model_path', fp)
                    }
                })
                .catch(error => {
                    console.error('Error sending POST request:', error);
                    setInfo([...info, 'Error sending POST request'])
                });
        }
    }

    const _transcribe = async (fp: string) => {
        let filepath = fp
        if (!filepath) filepath = await window.electron.openFile()
        if (filepath) {
            setSubtitle('处理中')
            console.log(filepath)
            fetch(`${url}:${port}/transcribe`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    filepath
                })
            })
                .then(response => response.json())
                .then(result => {
                    console.log('POST request successful:', result);
                    if (result.result) setSubtitle(result.result)
                })
                .catch(error => {
                    console.error('Error sending POST request:', error);
                });

        }
    }

    const _startRecording = () => {
        if (recording) {
            setRecording(false)
            stopRecording()
        } else {
            setRecording(true)
            startRecording()
        }

    }

    useEffect(() => {
        _api();
    }, []);

    useEffect(() => {
        const fn = async (res: any) => {
            console.log('###message', info, res.data?.data)
            const cmd = res.data?.cmd;
            const { info: _info, filePath } = res.data?.data || {};
            if (cmd === 'run-exe-file' && _info) {
                const f = decodeURI(_info);
                if (f.match(port)) {
                    // 成功
                    setInfo([f]);
                    if (modelpath) {
                        _setModel(false);
                    }
                } else {
                    setInfo([...info, f])
                }

            };

            if (cmd === 'recordingSaved' && filePath) {
                _transcribe(decodeURI(filePath));
            }
        };

        const mousemoveFn = (event: any) => {
            let data = { ignore: false }

            if (
                !['HTML'].includes(event.target.nodeName) ||
                event?.target.className === '_app_none_'
            ) {
                data = { ignore: false }
            } else {
                data = { ignore: true }
            }
            window.electron.setIgnoreMouseEvents(data)

        }

        window.addEventListener('message', fn);
        window.addEventListener('mousemove', mousemoveFn);

        return () => {
            window.removeEventListener('message', fn);
            window.removeEventListener('mousemove', mousemoveFn)
        };
    }, [info]);


    return (
        <ConfigProvider
            theme={{
                token: {
                    // Seed Token，影响范围大
                    colorPrimary: '#00b96b',
                    borderRadius: 2,

                    // 派生变量，影响范围小
                    colorBgContainer: '#f6ffed',
                },
            }}
        >
            <Card
                style={{
                    position: 'fixed',
                    height: '90vh',
                    width: 450,
                    overflowY: 'auto',
                    overflowX: 'hidden'
                }}
                extra={
                    <Button onClick={() => window.electron.closeApp()}><CloseOutlined /></Button>
                }
            >
                <p>{i18n.t('PORT')} </p>
                <>
                    <Input
                        style={{
                            width: 200
                        }}
                        min={49153}
                        max={65533}
                        type="number"
                        value={port} onChange={(e: any) => {
                            if (Math.round(e.target.value) >= 49152) setPort(Math.round(e.target.value))
                        }} />
                    <>  建议 49152-65535</>
                </>
                <div
                    style={{
                        marginTop: 8
                    }}
                >
                    <Button
                        type="primary"
                        onClick={() => {
                            window.electron.pythonApp(false, port);
                        }}><RedoOutlined />{i18n.t('Run')}</Button>
                    <Button
                        type="text"
                        onClick={() => _setModel()}>{modelpath ? '模型 ' + _shortTitle(modelpath, 10) : '配置模型'}</Button>
                    <Button
                        type="text"
                        style={{
                            marginLeft: 10
                        }}
                        onClick={_api}><ToolOutlined />{i18n.t('Test')}</Button>
                    <Button
                        type="text"
                        style={{
                            marginLeft: 18
                        }}
                        onClick={_close}><StopOutlined /></Button>

                </div>

                <Divider />

                <div style={{
                    height: 300,
                    overflowY: 'auto',
                    overflowX: 'hidden'
                }}>{Array.from(info, (inf: any) => {
                    return <div style={{ backgroundColor: '#eee', marginTop: 4, padding: 4, fontSize: 12 }}>{inf}<br /></div>
                })}</div>



                <Divider />

                <Button onClick={() => _startRecording()}>{recording ? '完成' : '录音'}</Button>
                <Button
                    style={{ marginLeft: 12 }}
                    onClick={() => _transcribe('')}>打开音频/视频文件</Button>
                <Divider />
                {
                    subtitle
                }
            </Card>
        </ConfigProvider>

    );
};


// 严格模式，会在开发环境重复调用2次
createRoot(document.getElementById("root") as Element).render(
    // <StrictMode>
    // </StrictMode>
    <App />
);