const KEY = "smzdm_cookie";
const TITLE = "什么值得买";

if (typeof $request !== "undefined") {
  getCookie();
} else {
  checkin();
}

function getCookie() {
  const headers = $request.headers || {};
  const cookie = headers["Cookie"] || headers["cookie"];
  if (cookie && /(^|;\s*)sess=/.test(cookie)) {
    const old = $persistentStore.read(KEY);
    if (old !== cookie) {
      const ok = $persistentStore.write(cookie, KEY);
      $notification.post(TITLE, ok ? "Cookie 获取成功 ✅" : "Cookie 保存失败 ❌", "");
    }
  }
  $done({});
}

function checkin() {
  const cookie = $persistentStore.read(KEY);
  if (!cookie) {
    $notification.post(TITLE, "未找到 Cookie ⚠️", "请先打开什么值得买 App,进入“我的”或签到页面");
    return $done();
  }

  const url = `https://zhiyou.smzdm.com/user/checkin/jsonp_checkin?callback=jQuery&_=${Date.now()}`;
  const headers = {
    "Cookie": cookie,
    "Referer": "https://www.smzdm.com/",
    "Accept": "*/*",
    "User-Agent":
      "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1",
  };

  $httpClient.get({ url, headers }, (err, resp, data) => {
    if (err) {
      $notification.post(TITLE, "网络错误 ❌", String(err));
      return $done();
    }
    try {
      const json = JSON.parse(
        data.replace(/^[^(]*\(/, "").replace(/\)\s*;?\s*$/, "")
      );
      if (json.error_code === 0) {
        const d = json.data || {};
        const sub = `连续签到:${d.continue_checkin_days ?? d.checkin_num ?? "-"} 天`;
        const body = `获得积分:${d.add_point ?? "-"}  经验:${d.add_exp ?? "-"}  金币:${d.add_gold ?? "-"}`;
        $notification.post(TITLE, "签到成功 ✅", `${sub}\n${body}`);
      } else {
        const msg = json.error_msg || JSON.stringify(json);
        const expired = /登录|login/i.test(msg);
        $notification.post(
          TITLE,
          expired ? "Cookie 可能已失效 ⚠️" : "签到失败/已签到 ⚠️",
          msg
        );
      }
    } catch (e) {
      $notification.post(TITLE, "解析失败 ❌", String(data).slice(0, 200));
    }
    $done();
  });
}
