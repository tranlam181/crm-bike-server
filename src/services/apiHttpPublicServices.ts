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


    /**
     * =>req.json_data
     * @param url 
     * @param json_data 
     */
    postDynamicForm(url:string,json_data:any){
        return this.httpClient.post(url,JSON.stringify(json_data))
                .toPromise()
                .then(data => {
                    let rtn:any;
                    rtn = data;
                    return rtn;
                });
    }

    /**
     * => req.form_data
     * @param url 
     * @param form_data 
     */
    postDynamicFormData(url:string, form_data:any){
        return this.httpClient.post(url,form_data)
                .toPromise()
                .then(data => {
                    let rtn:any;
                    rtn = data;
                    return rtn;
                });
    }

    /**
     * =>req.paramS --> return json
     * @param url 
     * @param httpOptions 
     */
    getDynamicForm(url:string, httpOptions?:any){
        return this.httpClient.get(url,httpOptions)
               .toPromise()
               .then(data => {
                    let rtn:any;
                    rtn = data;
                    return rtn;
                });
    }

    /**
     * =>req.paramS
     * return binary file
     * @param url 
     */
    getDynamicFile(url:string){
        return this.httpClient.get(url,{'responseType'  : 'blob' as 'json'})
               .toPromise()
               .then(data => {
                    let rtn:any;
                    rtn = data;
                    return rtn;
                });
    }

    /**
     * dua vao la text,
     * tim kiem chuyen doi tra ve
     * text gan the
     * @param text 
     */
    getHtmlLinkify(plainText:string){
        let valueLinkify = plainText;
        let links = [];

            //replace enter to break of html
            valueLinkify = valueLinkify.replace(/(?:\r\n|\r|\n)/g, '<br />');

            //URLs starting with http://, https://, or ftp://    
            valueLinkify = valueLinkify.replace(/(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim
                , function (url) {
                    links.push(url);
                    return "<a href='"+url+"' target='_blank'>" + url + "</a>";
                }
            );

            //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
            valueLinkify = valueLinkify.replace(/([ ])([\w-]+\.[\S]+(\b|$))/gim
                , function (url) {
                    links.push('http://'+url.trim());
                    return " <a href='http://"+url.trim()+"' target='_blank'>" + url.trim() + "</a>";
                }
            );

            //Change email addresses to mailto:: links.
            valueLinkify = valueLinkify.replace(/(([a-zA-Z0-9\-\_\.])+@[a-zA-Z\_]+?(\.[a-zA-Z]{2,6})+)/gim
                ,
                function (url) {
                    links.push('mailto:'+url);
                    return "<a href='mailto:"+url+"' target='_blank'>" + url + "</a>";
                }
                );


        //check alive links?
        //neu cac link con hien luc thi get no        

        return {content:valueLinkify,urls:links};
    }
}