import { Component } from '@angular/core';
import { ApiLocationService } from '../../services/apiLocationService';

@Component({
  selector: 'page-cordova-info',
  templateUrl: 'cordova-info.html'
})
export class CordovaPage {

  dynamicForm: any = { items: [] };

  constructor(
    private apiLocation: ApiLocationService
  ) { }

  async ngOnInit() {
    this.dynamicForm.items.push({ type: "title", name: "PLATFORM:" })
    
    let platform = this.apiLocation.getPlatform();
    let platformDetails = [];
    for (let key in platform) {
      platformDetails.push({ name: key, value: platform[key] })
    }
    this.dynamicForm.items.push({
      type: "details",
      details: platformDetails
    });
    
    
    this.dynamicForm.items.push({ type: "title", name: "DEVICE:" })
    let device = this.apiLocation.getDevice();
    let deviceDetails = [];
    for (let key in device) {
      if (device[key])
      deviceDetails.push({ name: key, value: device[key] })
    }
    this.dynamicForm.items.push({
      type: "details",
      details: deviceDetails
    });
    
    
    this.dynamicForm.items.push({ type: "title", name: "SIM:" })
    let sim = await this.apiLocation.getSim();
    let simDetails = [];
    for (let key in sim) {
      if (sim[key])
      simDetails.push({ name: key, value: sim[key] })
    }
    this.dynamicForm.items.push({
      type: "details",
      details: simDetails
    });
    
    
    this.dynamicForm.items.push({ type: "title", name: "NETWORK:" })
    let network=this.apiLocation.getNetwork();
    let networkDetails = [];
    for (let key in network) {
      if (network[key])
      networkDetails.push({ name: key, value: network[key] })
    }
    this.dynamicForm.items.push({
      type: "details",
      details: networkDetails
    });
    
    this.dynamicForm.items.push({ type: "title", name: "LOCATION:" })
    let location = await this.apiLocation.getCurrentLocation();
    let locationDetails = [];
    for (let key in location) {
      if (key==="timestamp"){
        locationDetails.push({ name: key, value: location[key], pipe_date: "HH:mm:ss dd/MM/yyyy" })
      }else{
        locationDetails.push({ name: key, value: location[key] })
      }
    }
    this.dynamicForm.items.push({
      type: "details",
      details: locationDetails
    });

  }

  onClickClose() {

  }
}
