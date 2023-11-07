// import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import React from "react";
import { useEffect } from "react";
import { Button, ConfigProvider, Space, message, Card, Spin, Progress } from 'antd';
import { PlusOutlined, DashboardOutlined } from '@ant-design/icons';
const hash = require('object-hash');
const { Meta } = Card;

import "./index.css";

import i18n from "i18next";
import { rendererInit } from '../../i18n/config'
rendererInit()


declare const window: Window &
    typeof globalThis & {
        electron: any
    }

export const App = () => {

    const [s, setS]: any = React.useState([]);

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

        window.addEventListener('mousemove', mousemoveFn)

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
            <>hello world</>
        </ConfigProvider>

    );
};


// 严格模式，会在开发环境重复调用2次
createRoot(document.getElementById("root") as Element).render(
    // <StrictMode>
    // </StrictMode>
    <App />
);