// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import React from "react";
import { useEffect } from "react";
import { Button, ConfigProvider, Space, message, Card, Spin, Progress, Divider } from 'antd';

import {
    CloseOutlined, RedoOutlined
} from '@ant-design/icons';

const hash = require('object-hash');
const { Meta } = Card;

import "./index.css";

import i18n from "i18next";
import { rendererInit } from '../../i18n/config'
rendererInit()

const url = 'http://127.0.0.1:6678'

declare const window: Window &
    typeof globalThis & {
        electron: any
    }

    const _shortTitle = (t: string, len: number = 12) => {
        return t ? t.slice(0, len) + (t.length > len ? '...' : '') : ''
    }

export const App = () => {

    const [info, setInfo]: any = React.useState('');
    const [modelpath, setModelpath]: any = React.useState('');
    const [subtitle, setSubtitle]: any = React.useState('');

    const _api = async () => {
        setInfo('')
        try {
            let res = await fetch(url)
            let data = await res.json()
            // console.log(data)
            if (data?.message) {
                setInfo(data.message)
            }
        } catch (error) {
            setInfo('')
        }
    }

    const _setModel = async () => {

        const mp = await window.electron.openDirectory()
        if (mp) {
            setModelpath('')
            console.log(mp)
            fetch(`${url}/setup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    modelpath: mp
                })
            })
                .then(response => response.json())
                .then(result => {
                    console.log('POST request successful:', result);
                    if (result.result) setModelpath(mp)
                })
                .catch(error => {
                    console.error('Error sending POST request:', error);
                });

        }
    }

    const _transcribe = async () => {
        const filepath = await window.electron.openFile()
        if (filepath) {
            setSubtitle('处理中')
            console.log(filepath)
            fetch(`${url}/transcribe`, {
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

    useEffect(() => {
        const fn = async (res: any) => {
            console.log('###message', res.data?.data)
            const { event, data } = res.data?.data;
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

        _api();

        return () => {
            window.removeEventListener('message', fn);
            window.removeEventListener('mousemove', mousemoveFn)
        };
    }, []);


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
                    height:'90vh',
                    width:400,
                    overflowY:'auto',
                    overflowX:'hidden'
                }}
                extra={
                    <Button onClick={() => window.electron.closeApp()}><CloseOutlined /></Button>
                }
            >
                <>{info} <RedoOutlined onClick={_api} /></>

                <Divider />
                <Button onClick={() => _setModel()}>{modelpath ? _shortTitle(modelpath,24) : '配置模型'}</Button>
                <Divider />
                <Button onClick={() => _transcribe()}>打开音频/视频文件</Button>
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