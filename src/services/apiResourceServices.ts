import { Injectable } from '@angular/core';
import { ApiStorageService } from './apiStorageService';
import { ApiAuthService } from './apiAuthService';

@Injectable()
export class ApiResourceService {

    resourceServer = ApiStorageService.resourceServer;

    constructor(
        private apiAuth: ApiAuthService
    ) {}

    /**
     * Tao file pdf de in an
     * trả về danh mục các file hóa đơn đã tạo trên máy chủ
     * [{201901_print_all.pdf}]
     * @param billCycle 
     */    
    createPdfInvoices(billCycle){
        return this.apiAuth.postDynamicForm(this.resourceServer+'/db/pdf-invoices'
                                    ,{
                                        bill_cycle: billCycle.bill_cycle,
                                        cust_id: billCycle.cust_id,
                                        background:billCycle.background
                                    }
                                    ,true)
        
    }

    /**
     * get hoa don (phai tao truoc, neu khong se không có file)
     * @param yyyymm_cust_id 
     */
    getPdfInvoices(yyyymm_cust_id){
        const httpOptions = {
            'responseType'  : 'arraybuffer' as 'json'
             //'responseType'  : 'blob' as 'json'        //This also worked
          };
          return this.apiAuth.getDynamicUrl(
              this.resourceServer+'/db/pdf-invoices/'+yyyymm_cust_id,
              true,
              httpOptions);
    }

    /**
     * billCycle = 
     * {
     * bill_cycle:
     * bill_date:
     * invoice_no: 
     * cust_id: 
     * }
     */
    createInvoices(billCycle){
        return this.apiAuth.postDynamicForm(this.resourceServer+'/db/create-invoices'
        ,{
            bill_cycle: billCycle.bill_cycle,
            bill_date: billCycle.bill_date,
            invoice_no: billCycle.invoice_no,
            cust_id: billCycle.cust_id
        },
        true)
    }

    /**
     * yyyymm_custId = 201901 hoac 201901/R000000001
     */
    getInvoices(yyyymm_custId){
        return this.apiAuth.getDynamicUrl(this.resourceServer+'/db/json-invoices/'+yyyymm_custId,true)
    }

    /**
     * lay ky cuoc da tao trong csdl
     */
    getBillCycle(){
        return this.apiAuth.getDynamicUrl(this.resourceServer+'/db/json-bill-cycles',true)
    }

    getAllCutomers(){
        return this.apiAuth.getDynamicUrl(this.resourceServer+'/db/json-customers',true)
    }

    getParamters(){
        return this.apiAuth.getDynamicUrl(this.resourceServer+'/db/json-parameters',true)
    }


    /**
     * truyen len {token:'...'}
     * @param jsonString 
     */
    authorizeFromResource(token){
        return this.apiAuth.postDynamicForm(this.resourceServer + '/auth/authorize-token', {check: true}, token)
    }

}