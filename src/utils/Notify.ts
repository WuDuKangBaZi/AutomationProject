export function showNotification(title:string, options = {}) {
    if (Notification.permission === "granted") {
      new Notification(title, options);
    }
  }