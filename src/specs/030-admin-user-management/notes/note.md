## Ghi chú refactor (đề xuất, chưa triển khai)
- [ ] escapeSearchWildcards (admin.services.mjs) nên tách ra utils dùng chung,
      vì dashboard.librarian.services.mjs đang search ILIKE không escape wildcard.
- [ ] Response helper trả lỗi (success:false, error:{code,message}) đang lặp lại
      ở nhiều controller (admin, announcement, dashboard.librarian...) — gộp về 1 util.
- [ ] Pagination (offset/limit/totalPages) lặp giữa admin.services.mjs và library.services.mjs.
- [ ] escapeCsvCell hiện chỉ ở admin.controllers.mjs, tách ra nếu sau này có export khác.
