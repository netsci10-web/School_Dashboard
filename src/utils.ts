import { Category } from "./types";

export const palette: { [key: string]: { bg: string; text: string; border: string; darkText: string; accentBg: string } } = {
  blue: { bg: "bg-blue-50", text: "text-blue-500", border: "border-blue-100", darkText: "text-blue-700", accentBg: "bg-blue-500" },
  green: { bg: "bg-green-50", text: "text-green-500", border: "border-green-100", darkText: "text-green-700", accentBg: "bg-green-500" },
  purple: { bg: "bg-purple-50", text: "text-purple-500", border: "border-purple-100", darkText: "text-purple-700", accentBg: "bg-purple-500" },
  orange: { bg: "bg-orange-50", text: "text-orange-500", border: "border-orange-100", darkText: "text-orange-700", accentBg: "bg-orange-500" },
  amber: { bg: "bg-amber-50", text: "text-amber-500", border: "border-amber-100", darkText: "text-amber-700", accentBg: "bg-amber-500" },
  red: { bg: "bg-red-50", text: "text-red-500", border: "border-red-100", darkText: "text-red-700", accentBg: "bg-red-500" },
  gray: { bg: "bg-gray-50", text: "text-gray-500", border: "border-gray-200", darkText: "text-gray-700", accentBg: "bg-gray-500" },
  teal: { bg: "bg-teal-50", text: "text-teal-500", border: "border-teal-100", darkText: "text-teal-700", accentBg: "bg-teal-500" },
  pink: { bg: "bg-pink-50", text: "text-pink-500", border: "border-pink-100", darkText: "text-pink-700", accentBg: "bg-pink-500" },
  indigo: { bg: "bg-indigo-50", text: "text-indigo-500", border: "border-indigo-100", darkText: "text-indigo-700", accentBg: "bg-indigo-500" },
  white: { bg: "bg-white", text: "text-gray-600", border: "border-gray-200", darkText: "text-gray-800", accentBg: "bg-gray-800" }
};

export const colorNames: { [key: string]: string } = {
  blue: "🔵 파란색",
  green: "🟢 초록색",
  purple: "🟣 보라색",
  orange: "🟠 주황색",
  amber: "🟡 노란색",
  red: "🔴 빨간색",
  gray: "⚫ 회색",
  teal: "💠 청록색",
  pink: "🌸 분홍색",
  indigo: "🌌 남색",
  white: "⚪ 흰색 (기본)"
};

export const iconList = [
  { class: "fa-folder", name: "폴더 (기본)" },
  { class: "fa-file-alt", name: "문서" },
  { class: "fa-child", name: "어린이" },
  { class: "fa-book", name: "책" },
  { class: "fa-chalkboard", name: "칠판" },
  { class: "fa-heart", name: "하트" },
  { class: "fa-tag", name: "태그" },
  { class: "fa-school", name: "학교 건물" },
  { class: "fa-exclamation", name: "중요/느낌표" },
  { class: "fa-info-circle", name: "정보/안내" },
  { class: "fa-building", name: "건물/시설" },
  { class: "fa-users", name: "사용자/교직원" },
  { class: "fa-clipboard-list", name: "게시판/목록" },
  { class: "fa-link", name: "링크/연결" },
  { class: "fa-check-square", name: "체크박스/할일" },
  { class: "fa-external-link-alt", name: "외부링크" },
  { class: "fa-home", name: "홈/집" },
  { class: "fa-globe", name: "지구본/웹" },
  { class: "fa-phone", name: "전화기" },
  { class: "fa-envelope", name: "우편/메일" },
  { class: "fa-star", name: "별/즐겨찾기" },
  { class: "fa-bell", name: "종/알림" },
  { class: "fa-calendar-alt", name: "달력/일정" },
  { class: "fa-cog", name: "톱니바퀴/설정" },
  { class: "fa-camera", name: "카메라/사진" },
  { class: "fa-video", name: "비디오/영상" },
  { class: "fa-bullhorn", name: "확성기/공지" },
  { class: "fa-comments", name: "말풍선/대화" },
  { class: "fa-question-circle", name: "물음표/질문" },
  { class: "fa-paper-plane", name: "종이비행기/전송" },
  { class: "fa-download", name: "다운로드" },
  { class: "fa-images", name: "이미지/갤러리" }
];

export const formatUrl = (url: string): string => {
  if (!url || url.trim() === "" || url.trim() === "#") return "#";
  let formatted = url.trim();
  if (!/^https?:\/\//i.test(formatted)) formatted = "http://" + formatted;
  return formatted;
};

export const generateId = () => "id_" + Date.now().toString(36) + Math.random().toString(36).substring(2);

export function migrateDataFormat(data: any): any {
  if (!data) return null;
  const migrated = { ...data };
  if (!migrated.categories) migrated.categories = [];
  if (!migrated.pageTitle) migrated.pageTitle = "학교업무 대시보드";
  if (migrated.pageDescription === undefined) migrated.pageDescription = "학교 업무에 필요한 자료를 쉽게 찾아보세요!";
  if (!migrated.copyright) migrated.copyright = "© Netsci 모든 권리 보유";
  if (migrated.contactEmail === undefined) migrated.contactEmail = "";
  if (migrated.masterPassword === undefined) migrated.masterPassword = "";
  
  if (migrated.quickLinkPosition === undefined) migrated.quickLinkPosition = "top";
  if (migrated.quickLinkBarColor === undefined) migrated.quickLinkBarColor = "white";
  if (!migrated.quickLinks) migrated.quickLinks = [];

  migrated.categories = migrated.categories.map((cat: any) => {
    const c = { ...cat };
    if (c.type === undefined) c.type = "menu";
    if (c.colSpan === undefined) c.colSpan = 1;
    if (c.posts === undefined) c.posts = [];
    if (c.todos === undefined) c.todos = [];
    if (c.password === undefined) c.password = "";
    if (c.link === undefined) c.link = "";
    
    if (!c.groups && c.items) {
      c.groups = [{
        id: "grp_" + Math.random().toString(36).substring(2, 7),
        title: "기본 목록",
        icon: "fa-folder",
        color: "gray",
        password: "",
        link: "",
        items: c.items
      }];
      delete c.items;
    } else if (!c.groups) {
      c.groups = [];
    }

    c.groups = c.groups.map((group: any) => {
      const g = { ...group };
      if (g.password === undefined) g.password = "";
      if (g.link === undefined) g.link = "";
      if (g.items) {
        g.items = g.items.map((item: any) => {
          const it = { ...item };
          if (it.password === undefined) it.password = "";
          return it;
        });
      } else {
        g.items = [];
      }
      return g;
    });

    return c;
  });

  return migrated;
}
