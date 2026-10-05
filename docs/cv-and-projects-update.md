# CV và dự án cập nhật — 02/10/2026

## Nguồn và phạm vi

Đã đọc hai trang `src/docs/DuongTanMinh_CV.pdf`, đối chiếu thông tin bổ sung của chủ portfolio và đọc source hiện tại của hai repository lân cận. Sau khi người dùng duyệt Mixed, dữ liệu được chuyển sang `src/site/content.js`, dùng chung cho production và A/B/C/Mixed preview. Không sửa source hai repository, không deploy ứng dụng và không chỉnh sửa PDF. Các chỉnh sửa hiện tại của người dùng được giữ lại: tên hiển thị RE:SEARCH và phân loại Outsourcing project.

PDF hiện vẫn ghi Scavi **Apr 2025–Now** và chưa có Mi-Jack Vietnam. Thông tin người dùng xác nhận trong phiên làm việc này được ưu tiên cho mốc việc làm:

| Công ty | Vai trò | Thời gian | Nguồn |
| --- | --- | --- | --- |
| Mi-Jack Vietnam | Fullstack Developer | May 2026–Present | Người dùng: Power Platform, Power Apps, Power Automate, React, .NET |
| Scavi | Fullstack Developer | Apr 2025–Apr 2026 | CV: thời điểm bắt đầu, trách nhiệm; người dùng: thời điểm kết thúc |
| DevDirect | Front-end Developer | Apr 2024–Apr 2025 | CV |
| BeanOi Company | Front-end Developer | Apr 2022–Jul 2023 | CV |

Không bổ sung tên dự án nội bộ, quy mô đội ngũ hay thành tích tại Mi-Jack khi chưa có dữ liệu. Chức danh tổng quát Software Developer, liên hệ, học vấn và giải thưởng giữ theo CV.

## Acupressure Map

Tên repository thực tế là **acupressure-map**, tương ứng dự án người dùng gọi là “acupunture-map”. Đây là atlas huyệt vị trên ảnh giải phẫu 2D và công cụ ôn tập, không phải scene giải phẫu 3D.

| Nội dung xác nhận từ source | Bằng chứng trong repository |
| --- | --- |
| React, TypeScript, Vite, Firebase, TailwindCSS, Fuse.js; cấu hình PWA | `package.json`, `vite.config.ts` |
| Bản đồ bốn góc nhìn, lọc vùng cơ thể, zoom/pan, tương tác cảm ứng và kéo marker khi chỉnh sửa | `src/components/BodyMap.tsx`, `src/pages/PointsPage.tsx`, `src/data/types.ts` |
| Tìm kiếm gần đúng tiếng Việt, chuẩn hóa dấu và ký tự đ | `src/data/search.ts` |
| Flashcard, trạng thái đã học/chưa học, tiến độ theo tài khoản | `src/pages/FlashcardPage.tsx`, `src/data/useProgress.ts` |
| Firebase Auth; giao diện quản trị người dùng/nội dung; dữ liệu Firestore và ảnh Storage | `src/auth/AuthContext.tsx`, `src/auth/createManagedUser.ts`, `src/data/usePoints.ts`, `src/data/useFlashcards.ts`, `src/components/ImagePicker.tsx`, `firestore.rules`, `storage.rules` |
| Có source kiểm thử component, tìm kiếm và dữ liệu | Các file `*.test.ts` / `*.test.tsx` trong `src` |

Điểm kỹ thuật nên đưa vào portfolio: duy trì tọa độ marker chuẩn hóa khi zoom/kéo, tìm kiếm tiếng Việt và liên kết hành vi học với dữ liệu theo người dùng. Luồng tạo tài khoản quản trị sử dụng một Firebase Auth instance phụ để giữ phiên của quản trị viên.

Giới hạn mô tả: cấu hình PWA không chứng minh toàn bộ dữ liệu Firestore hoạt động offline; JSON dự phòng khi collection rỗng không tương đương dự phòng khi mất mạng. Chưa chạy test hoặc kiểm tra deployment của repository này trong lần phân tích; không khẳng định độ phủ test, hiệu năng, số người dùng hoặc hiệu quả y khoa.

## RE:SEARCH v2

Ứng dụng cộng đồng học tập dùng React/TypeScript và Firebase. Entry thực tế `src/main.tsx` trỏ vào `src/app/App.tsx`; router và tính năng nằm dưới `src/app` và `src/features`. Thư mục `legacy-research-app` được giữ lại, không đại diện backend của bản v2 đang chạy.

| Nội dung xác nhận từ source | Bằng chứng trong repository |
| --- | --- |
| Firebase Auth, profile Firestore và điều hướng theo module tính năng | `src/features/auth/AuthContext.tsx`, `src/app/router.tsx` |
| Forum, phản hồi realtime, upvote, rich-text editor và sanitize HTML khi render | `src/features/forum/Forum.tsx`, `src/features/forum/CreatePost.tsx`, `src/features/forum/PostDetail.tsx` |
| Pomodoro, cài đặt phiên học, danh sách việc cục bộ và study presence qua Firestore | `src/features/study/StudyLounge.tsx`, `src/features/study/StudyCustomization.tsx` |
| Thư viện liên kết tài liệu và đề xuất tài liệu | `src/features/documents/Documents.tsx` |
| Quiz có thời gian, lưu lượt làm và bảng xếp hạng | `src/features/competition/QuizRunner.tsx`, `src/features/competition/Leaderboard.tsx`, `src/features/competition/AdminCompetition.tsx` |
| React Router, TailwindCSS, Quill và DOMPurify | `package.json` |

Điểm kỹ thuật nên đưa vào portfolio: quản lý subscription Firestore, hiển thị rich text đã sanitize và tổ chức ứng dụng thành các module forum/study/documents/competition.

Giới hạn mô tả: thư viện tài liệu lưu liên kết, không phải pipeline upload file. Khu vực thảo luận tài liệu còn placeholder. Chấm điểm quiz ở client; `firestore.rules` còn quyền ghi rộng cho MVP, bao gồm cập nhật posts và một số dữ liệu competition/profile. Không mô tả ứng dụng là đã có phân quyền production hoàn chỉnh hoặc cơ chế chống gian lận. Không gán Express/SQLite của legacy cho v2, không suy đoán đã có người dùng thực tế hoặc link demo hoạt động.

## Nội dung tiếng Anh sẵn để cập nhật CV

### Professional summary

Fullstack Developer focused on Microsoft Power Platform, Power Apps, Power Automate, React and .NET. Experienced in ERP systems, web applications and workflow automation, with personal projects in interactive learning and study communities.

### Mi-Jack Vietnam — Fullstack Developer

**May 2026–Present**

- Develop applications with Microsoft Power Apps and workflow automation with Power Automate.
- Work across React interfaces and .NET development alongside Power Platform solutions.
- Technologies: Power Platform, Power Apps, Power Automate, React, .NET.

### Scavi — Fullstack Developer

Change the date range to **Apr 2025–Apr 2026**. Retain the existing CV responsibilities for SCAF/ISCAF, ERP integrations, Power Platform and backend services.

### Acupressure Map — Outsourcing Project

- Built an interactive four-view anatomical atlas with region filtering, zoom/pan, touch gestures and Vietnamese fuzzy search.
- Implemented flashcard learning modes and per-user progress with Firebase Auth and Firestore, plus administrator content editing and image management.
- Technologies: React, TypeScript, Firebase, Firestore, TailwindCSS, Fuse.js; PWA configuration.

### RE:SEARCH — Outsourcing Project

- Built a study-community application with realtime forum discussions, rich-text editing, user profiles and a shared document-link library.
- Implemented a Pomodoro study lounge, study presence, timed quizzes, stored attempts and leaderboards using Firebase Auth and Firestore.
- Technologies: React, TypeScript, Firebase, Firestore, React Router, TailwindCSS, Quill, DOMPurify.

## Thay đổi portfolio

Hai dự án mới thay **FINE Delivery** và đứng đầu Selected Work. PhuongNamCompany được giữ lại; Kyansunitour đã được bỏ theo yêu cầu mới. Hero, About và nhóm năng lực phản ánh công việc hiện tại với Power Platform/React/.NET. Hình dự án vẫn là sơ đồ chức năng, không phải screenshot của ứng dụng. Ba dự án đã có URL do người dùng cung cấp: https://acupunture-map.vercel.app/, https://re-search-platform.web.app/ và https://phuongnam.net.vn/. Mỗi dự án có nút mở tab mới và xem trực tiếp trong dialog iframe; Phuong Nam dùng HTTPS để tránh mixed content.

PDF tải xuống vẫn là file người dùng cung cấp; cập nhật nội dung preview không tự cập nhật PDF. Có thể sử dụng các đoạn tiếng Anh ở trên khi xuất lại CV.

## Kiểm tra sau cập nhật

- `node scripts/check-preview.mjs`: PASS — A/B/C ở sáu độ rộng, bao gồm kiểm tra Mi-Jack Vietnam, hai dự án mới, ngày kết thúc Scavi và không còn FINE Delivery; navigation, tải PDF, reduced motion và WebGL fallback.
- `node scripts/check-mixed-preview.mjs`: PASS — Mixed responsive, quote, các lớp theo scroll, Blogs và ba Tools.
- `git diff --check`: PASS cho thay đổi tracked; các tệp mới được đọc lại để kiểm tra nội dung. Không chạy test của hai repository dự án trong lần phân tích này.
