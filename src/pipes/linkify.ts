import { Pipe, PipeTransform } from '@angular/core';
import { ApiAuthService } from '../services/apiAuthService';
import { ApiStorageService } from '../services/apiStorageService';
/*
 * Converts linkify into html domain/http/ftp/email/phone
*/
@Pipe({ name: 'linkify' })
export class LinkifyPipe implements PipeTransform {
    constructor( private apiAuth: ApiAuthService) {}
    transform(value: string, isUrl: string ): any {

        let valueLinkify = value;
        let links = [];
    
            if (valueLinkify){
                //URLs starting with http://, https://, or ftp://    
                valueLinkify = valueLinkify.replace(/(\b(https?|ftp):\/\/[-A-Z0-9+&@#\/%?=~_|!:,.;]*[-A-Z0-9+&@#\/%=~_|])/gim
                    , 
                    function (url) {
                        links.push(url);
                        return "<a href='"+url+"' target='_blank'>" + url + "</a>";
                    }
                );
        
                //URLs starting with "www." (without // before it, or it'd re-link the ones done above).
                valueLinkify = valueLinkify.replace(/([ ])([\w-]+\.[\S]+(\b|$))/gim
                    , 
                    function (url) {
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
            }

        if (isUrl==='links') return links; //array off urls

        if (isUrl==='urlInfos') {
            let urlInfos = [];
            links.forEach(async el=>{
                try{
                    let urlInfo = await this.apiAuth.getDynamicUrl(ApiStorageService.authServer + "/ext-public/shot-info-url?url="+el);
                    urlInfos.push(urlInfo);
                }catch{}
            })
            return urlInfos;
        }

        return valueLinkify;

    }
}