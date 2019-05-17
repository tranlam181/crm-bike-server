import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';


@Injectable()
export class ApiHttpPublicService {

    
    constructor(private httpClient: HttpClient) {}

    /**
     * Lay danh sach cac quoc gia ve Ma so dien thoai, co, ten, ngon ngu, tien...
     */
    getAllCoutries(){
        return this.httpClient.get('https://restcountries.eu/rest/v2/all')
        .toPromise()                 //kieu chuyen ve promise
        .then(countries=>{
            return countries;
        })
        .catch(err=>{
            throw err;
        })
    }

    /**
     * Lay danh sach user demo phuc vu so lieu demo
     */
    getRandomUser(nRecord: number){
        return this.httpClient.get('https://randomuser.me/api/?results=' + nRecord)
            .map(res => res['results']) //kieu chuyen ve observable
    }


    getMyIp(){
        return this.httpClient.get('https://ipinfo.io/json')
                .toPromise()
                .then(data => {
                let rtn:any;
                rtn = data;
                return rtn;
                });
    }

    getMyDevice(id?:string){
        return this.httpClient.get('https://c3.mobifone.vn/api/ext-public/your-device'+(id?"?id="+id:""))
                .toPromise()
                .then(data => {
                let rtn:any;
                rtn = data;
                return rtn;
                });
    }


    getDataForm(form:string){
        return this.httpClient.get('assets/data/'+ form)
                .toPromise()
                .then(data => {
                let rtn:any;
                rtn = data;
                return rtn;
                });
    }

    getUserInfoForm(){
        return this.httpClient.get('assets/data/form-register.json')
               .toPromise()
               .then(data => {
                let rtn:any;
                rtn = data;
                return rtn;
                });
    }


    
    postDynamicForm(url:string,json_data:any){
        return this.httpClient.post(url,JSON.stringify(json_data))
                .toPromise()
                .then(data => {
                    let rtn:any;
                    rtn = data;
                    return rtn;
                });
    }

    postDynamicFormData(url:string, form_data:any){
        return this.httpClient.post(url,form_data)
                .toPromise()
                .then(data => {
                    let rtn:any;
                    rtn = data;
                    return rtn;
                });
    }

    getDynamicForm(url:string, httpOptions?:any){
        return this.httpClient.get(url,httpOptions)
               .toPromise()
               .then(data => {
                    let rtn:any;
                    rtn = data;
                    return rtn;
                });
    }

    getDynamicFile(url:string){
        return this.httpClient.get(url,{'responseType'  : 'blob' as 'json'})
               .toPromise()
               .then(data => {
                    let rtn:any;
                    rtn = data;
                    return rtn;
                });
    }

}