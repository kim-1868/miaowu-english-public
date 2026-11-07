// Synthetic-only consumer: no private API, no live book content.
(() => {
"use strict";
const list=document.getElementById("bookGrid");
const status=document.getElementById("syntheticPage");
const pager=window.MiaowuShelfPagination?.create({document});
if(!pager)throw Error("PUBLIC_SHELF_PAGINATION_MISSING");
let page=1;
function render(){
  status.textContent="当前第 "+page+" 页";
  pager.render({container:list,meta:{totalPages:16,total:144},currentPage:page,pageSize:9,
    onPageChange(next){page=next;render();}});
}
render();
})();
