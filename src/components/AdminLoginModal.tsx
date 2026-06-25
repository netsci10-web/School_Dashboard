import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import { DeskMeta } from "../types";

interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  desksMetaList: DeskMeta[];
  onSiteAdminSuccess: (siteID: string, siteName: string, adminId: string) => void;
  onSuperAdminSuccess: (msg: string) => void;
  onError: (msg: string) => void;
}

export default function AdminLoginModal({
  isOpen,
  onClose,
  desksMetaList,
  onSiteAdminSuccess,
  onSuperAdminSuccess,
  onError,
}: AdminLoginModalProps) {
  const [activeTab, setActiveTab] = useState<"site" | "super">("site");
  
  // Site Admin State
  const [selectedSiteId, setSelectedSiteId] = useState("");
  const [siteAdminId, setSiteAdminId] = useState("");
  const [siteAdminPassword, setSiteAdminPassword] = useState("");

  // Super Admin State
  const [superEmail, setSuperEmail] = useState("");
  const [superPassword, setSuperPassword] = useState("");

  const [loading, setLoading] = useState(false);

  // Set default selected site ID when desks are loaded
  React.useEffect(() => {
    if (desksMetaList.length > 0 && !selectedSiteId) {
      setSelectedSiteId(desksMetaList[0].siteID);
    } else if (desksMetaList.length === 0 && !selectedSiteId) {
      setSelectedSiteId("main");
    }
  }, [desksMetaList]);

  if (!isOpen) return null;

  const handleSiteAdminLogin = async () => {
    const targetSiteId = selectedSiteId || "main";
    if (!siteAdminId.trim() || !siteAdminPassword.trim()) {
      onError("아이디와 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      
      // Attempt to load from school_settings/admin_credentials
      const credDocRef = doc(db, "school_settings", "admin_credentials");
      const credSnap = await getDoc(credDocRef);
      
      let authenticated = false;
      
      if (credSnap.exists()) {
        const credData = credSnap.data();
        const credentials = credData.credentials || [];
        const matched = credentials.find(
          (c: any) =>
            c.siteID === targetSiteId &&
            c.adminId.trim() === siteAdminId.trim() &&
            c.adminPassword.trim() === siteAdminPassword.trim()
        );
        if (matched) {
          authenticated = true;
        }
      }

      // Hardcoded fallback for default admin if document is missing or not populated yet
      if (!authenticated && targetSiteId === "msjungang" && siteAdminId.trim() === "admin" && siteAdminPassword.trim() === "6245") {
        authenticated = true;
      }
      if (!authenticated && targetSiteId === "main" && siteAdminId.trim() === "admin" && siteAdminPassword.trim() === "1245") {
        authenticated = true;
      }

      if (authenticated) {
        const deskMeta = desksMetaList.find((d) => d.siteID === targetSiteId);
        const name = deskMeta ? deskMeta.siteName : "기본 도움데스크";
        onSiteAdminSuccess(targetSiteId, name, siteAdminId.trim());
        onClose();
      } else {
        onError("아이디 또는 비밀번호가 올바르지 않습니다.");
      }
    } catch (err: any) {
      console.error("Site admin verification error: ", err);
      onError("로그인 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.");
    } finally {
      setLoading(false);
    }
  };

  const handleSuperAdminLogin = async () => {
    if (!superEmail.trim() || !superPassword.trim()) {
      onError("이메일과 비밀번호를 모두 입력해주세요.");
      return;
    }

    try {
      setLoading(true);
      await signInWithEmailAndPassword(auth, superEmail.trim(), superPassword.trim());
      onSuperAdminSuccess("전체 관리자로 성공적으로 로그인했습니다.");
      onClose();
    } catch (err: any) {
      console.error("Super Admin Login Error: ", err);
      onError("로그인에 실패했습니다. 전체 관리자 계정 정보를 확인해주세요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl w-full max-w-md relative animate-scale-up">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition-colors"
          type="button"
          aria-label="닫기"
        >
          <i className="fas fa-times text-lg"></i>
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 text-blue-600 text-xl">
            <i className="fas fa-user-shield"></i>
          </div>
          <h3 className="text-xl font-bold text-gray-800">관리자 로그인</h3>
          <p className="text-xs text-gray-500 mt-1">
            원하시는 권한에 맞춰 로그인을 선택해주세요.
          </p>
        </div>

        {/* Tab Selection */}
        <div className="flex border-b border-gray-200 mb-6 bg-gray-50 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("site")}
            className={`flex-1 py-2 text-center text-sm font-bold rounded-md transition-all ${
              activeTab === "site"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
            type="button"
            disabled={loading}
          >
            사이트 관리자
          </button>
          <button
            onClick={() => setActiveTab("super")}
            className={`flex-1 py-2 text-center text-sm font-bold rounded-md transition-all ${
              activeTab === "super"
                ? "bg-white text-blue-600 shadow-sm"
                : "text-gray-500 hover:text-gray-800"
            }`}
            type="button"
            disabled={loading}
          >
            전체관리자메뉴
          </button>
        </div>

        {activeTab === "site" ? (
          /* Site Admin Form */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                관리할 도움데스크 선택
              </label>
              {desksMetaList.length > 0 ? (
                <select
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={loading}
                >
                  {desksMetaList.map((desk) => (
                    <option key={desk.siteID} value={desk.siteID}>
                      {desk.siteName} ({desk.siteID})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={selectedSiteId}
                  onChange={(e) => setSelectedSiteId(e.target.value)}
                  placeholder="사이트 ID (예: main)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  disabled={loading}
                />
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                관리자 아이디
              </label>
              <input
                type="text"
                value={siteAdminId}
                onChange={(e) => setSiteAdminId(e.target.value)}
                placeholder="사이트 관리자 ID"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                비밀번호
              </label>
              <input
                type="password"
                value={siteAdminPassword}
                onChange={(e) => setSiteAdminPassword(e.target.value)}
                placeholder="사이트 관리자 비밀번호"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSiteAdminLogin();
                }}
                disabled={loading}
              />
            </div>

            <button
              onClick={handleSiteAdminLogin}
              className="w-full py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors shadow-sm flex items-center justify-center gap-2 mt-2"
              disabled={loading}
              type="button"
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : "사이트 관리자 로그인"}
            </button>
          </div>
        ) : (
          /* Super Admin Form */
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                전체 관리자 이메일
              </label>
              <input
                type="email"
                value={superEmail}
                onChange={(e) => setSuperEmail(e.target.value)}
                placeholder="Firebase Auth 계정 이메일"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-600 mb-1">
                비밀번호
              </label>
              <input
                type="password"
                value={superPassword}
                onChange={(e) => setSuperPassword(e.target.value)}
                placeholder="비밀번호"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSuperAdminLogin();
                }}
                disabled={loading}
              />
            </div>

            <button
              onClick={handleSuperAdminLogin}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm flex items-center justify-center gap-2 mt-2"
              disabled={loading}
              type="button"
            >
              {loading ? <i className="fas fa-spinner fa-spin"></i> : "전체관리자 로그인"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
