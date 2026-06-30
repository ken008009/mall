import { isDwebEnv, loadPlaoc } from '@/tools/dweb'
import { type $WALLET_PLAOC_PATH_RESPONSE, type $WALLET_PLAOC_PATH_REQUEST_PARAMETER, $WALLET_PLAOC_PATH, $WALLET_SIGNATURE_TYPE } from "./types";
import { PromiseOut } from "@bnqkl/util-web/extends-promise-out";

/** 是否有安装应用 */
const canOpenId = async (id: `${string}.dweb`) => {
  if (!isDwebEnv()) return false
  const { dwebServiceWorker } = await loadPlaoc()
  return dwebServiceWorker.has(id)
}

/** 窗口最大化 */
const appMaximize = async () => {
  if (!isDwebEnv()) return
  const { windowPlugin } = await loadPlaoc()
  return windowPlugin.maximize()
}

/** 应用聚焦 */
const focusWindow = async () => {
  if (!isDwebEnv()) return
  const { windowPlugin } = await loadPlaoc()
  return windowPlugin.focusWindow()
}

/** 重启 */
const restart = async () => {
  if (!isDwebEnv()) return
  const { dwebServiceWorker } = await loadPlaoc()
  return dwebServiceWorker.restart()
}

/** 调用对应 biw 钱包获取相对应数据 */
const getBIWMetaAppData = <
  T extends keyof $WALLET_PLAOC_PATH_RESPONSE,
  U extends $WALLET_PLAOC_PATH_REQUEST_PARAMETER[T],
>(id: `${string}.dweb`, pathname: T, search?: any) => {
  const promiseOut = new PromiseOut<$WALLET_PLAOC_PATH_RESPONSE[T]>();

  if (!isDwebEnv()) {
    promiseOut.reject(new Error('Not in DWeb environment'))
    return {
      getData: () => promiseOut.promise,
      abort: () => promiseOut.reject(new Error('request abort')),
    }
  }

  void loadPlaoc().then(({ dwebServiceWorker }) => {
    let signaturedata = '';
    let activate = true;
    const url = new URL(pathname, `file://${id}`);
    if (search) {
      if (pathname === $WALLET_PLAOC_PATH.signature) {
        signaturedata = JSON.stringify(search);
        if (search && search.length === 1) {
          const item = search[0];
          if (item.type === $WALLET_SIGNATURE_TYPE.assetTypeBalance) {
            activate = false;
          }
        }
      } else {
        for (const key in search) {
          url.searchParams.set(key, search[key]);
        }
      }
    }
    const init = {
      activate,
      method: "POST",
      body: signaturedata,
    };

    dwebServiceWorker.fetch(url.href, init)
      .then(async (res: any) => {
        if (res.ok) {
          const dataJson = await res.json();
          const data = dataJson.data
          if (data) {
            const errorItem = data.find((item: any) => {
              if (item && typeof item === "object" && 'error' in item) {
                return item.error
              }
              return false;
            });
            if (errorItem) {
              promiseOut.reject(new Error((errorItem as { message: string }).message));
              throw new Error((errorItem as { message: string }).message);
            }
          }
          promiseOut.resolve(data);
          return res;
        } else {
          const error = await res.text();
          promiseOut.reject(new Error(error));
        }
      })
      .catch((err: any) => {
        promiseOut.reject(err);
      })
  }).catch((err) => {
    promiseOut.reject(err)
  })

  return {
    getData: () => promiseOut.promise,
    abort: () => promiseOut.reject(new Error("request abort")),
  }
}

export default {
  canOpenId,
  appMaximize,
  restart,
  getBIWMetaAppData,
  focusWindow,
}
