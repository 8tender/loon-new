const KEY = "smzdm_app_checkin";
const TITLE = "什么值得买";

if (typeof $request !== "undefined") {
  capture();
} else {
  run();
}

function capture() {
  const data = {
    url: $request.url,
    headers: $request.headers,
    body: $request.body || "",
  };
  const ok = $persistentStore.write(JSON.stringify(data), KEY);
  $notification.post(TITLE, ok ? "已捕获App签到请求 ✅" : "保存失败 ❌", "");
  $done({});
}

function run() {
  const raw = $persistentStore.read(KEY);
  if (!raw) {
    $notification.post(TITLE, "未捕获签到请求 ⚠️", "请先在App里手动签到一次");
    return $done();
  }

  const r = JSON.parse(raw);
  const headers = Object.assign({}, r.headers);
  ["Content-Length", "content-length", "Host", "host"].forEach(k => delete headers[k]);

  $httpClient.post({ url: r.url, headers, body: r.body }, (err, resp, data) => {
    console.log("status: " + (resp && resp.status));
    console.log("response: " + data);

    if (err) {
      $notification.post(TITLE, "网络错误 ❌", String(err));
      return $done();
    }
    try {
      const json = JSON.parse(data);
      if (String(json.error_code) === "0") {
        const d = json.data || {};
        $notification.post(TITLE, "签到成功 ✅", `连续签到:${d.daily_attendance_number ?? "-"} 天`);
      } else {
        $notification.post(TITLE, "签到失败 ⚠️", json.error_msg || data.slice(0, 200));
      }
    } catch (e) {
      $notification.post(TITLE, "解析失败 ❌", String(data).slice(0, 200));
    }
    $done();
  });
}
