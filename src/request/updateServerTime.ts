import { debounce } from 'lodash';
import { getConfig } from './config';
import { Global } from './is';

const originalDate = Global.Date;

export const debounceNotice = debounce(() => {
  getConfig().showMessageError('您当前电脑的时区设置有误，请联系实施人员处理');
}, 1000);

Global.Date = new Proxy(originalDate, {
  construct(target, args: [any]) {
    let time;
    if (!args.length && Global.$serverTimeStamp) {
      const diff = originalDate.now() - curTimeStamp;
      time = new target(Global.$serverTimeStamp + diff);
      const utc = time.getTime() + time.getTimezoneOffset() * 60000; // 转为 UTC 时间
      const chinaDate = new originalDate(utc + 8 * 60 * 60 * 1000); // 加上时差得到东八区时间
      return chinaDate;
    } else {
      time = new target(...args);
    }
    // const offset = time.getTimezoneOffset();
    // if (offset !== -480) {
    //   debounceNotice();
    // }
    return time;
  },
});

let curTimeStamp = 0;

export const updateServerTime = (serverTime: number) => {
  Global.$serverTimeStamp = serverTime;
  curTimeStamp = originalDate.now();
};

Global.$OriginDate = originalDate;
