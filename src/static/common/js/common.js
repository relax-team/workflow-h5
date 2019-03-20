/*
* 仿Vue开发规范
* */
class Page{
  constructor(params){
    this.data = params.data;
    Object.keys(params.methods).map(v=>{
      this[v] = params.methods[v];
    });
    params.created.call(this);
  }
}



