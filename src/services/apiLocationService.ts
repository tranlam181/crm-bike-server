
/**
 * dich vu nay lay va kiem tra thiet bi cordova
 * gom:
 * network
 * device
 * sim
 * platform
 * toa do
 */

import { Geolocation } from '@ionic-native/geolocation';
import { Injectable } from '@angular/core';
import { Platform, Events } from 'ionic-angular';

//cordova
import { Device } from '@ionic-native/device';
import { Network } from '@ionic-native/network';
import { Sim } from '@ionic-native/sim';

@Injectable()
export class ApiLocationService {

    locationTracking: any;
    currenLocation: any;

    constructor(
        private sim: Sim,
        private network: Network,
        private device: Device,
        private events: Events,
        private geoLocation: Geolocation,
        private platform: Platform
    ) { }



    getPlatform() {
        return {
            platforms: this.platform.platforms(),
            is_cordova: this.platform.is('cordova'),
            is_web: this.platform.is('core'),
            is_ios: this.platform.is('ios'),
            is_android: this.platform.is('android'),
            is_mobile: this.platform.is('mobile')
        }
    }

    getDevice() {
        return {
            cordova: this.device.cordova,
            is_virtual: this.device.isVirtual,
            manufacturer: this.device.manufacturer,
            model: this.device.model,
            serial: this.device.serial,
            platform: this.device.platform,
            uuid: this.device.uuid,
            version: this.device.version
        }
    }

    getNetwork() {
        return {
            type: this.network.type,
            downlinkMax: this.network.downlinkMax
        }

    }

    getSim() {
        return this.sim.getSimInfo()
            .then(info => {
                return {
                    carrier_name: info.carrierName,
                    country_code: info.countryCode,
                    phone: info.phoneNumber,
                    mcc: info.mcc,
                    mnc: info.mnc,
                    imsi: info.subscriberId
                }
            })
            .catch(err => {
                return { error: JSON.stringify(err) }
            })
    }

    getCurrentLocation() {
        return this.geoLocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 5000,
            maximumAge: 3000
        })
            .then(pos => {
                if (pos.coords) {
                    this.currenLocation = {
                        lat: pos.coords.latitude,
                        lng: pos.coords.longitude,
                        accuracy: pos.coords.accuracy,
                        speed: pos.coords.speed,
                        altitude: pos.coords.altitude,
                        altitudeAccuracy: pos.coords.altitudeAccuracy,
                        heading: pos.coords.heading,
                        timestamp: pos.timestamp,
                        time_tracking: new Date().getTime()
                    };
                    return this.currenLocation;
                } else {
                    return { error: "no location" }
                }
            })
            .catch((err) => {
                return { error: err }
            })
    }

    //Theo dõi thay đổi vị trí
    startTracking() {
        this.locationTracking
            = this.geoLocation.watchPosition(
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 3000
                }
            )
                .subscribe((pos) => {
                    if (pos.coords) {
                        this.currenLocation = {
                            lat: pos.coords.latitude,
                            lng: pos.coords.longitude,
                            accuracy: pos.coords.accuracy,
                            speed: pos.coords.speed,
                            altitude: pos.coords.altitude,
                            altitudeAccuracy: pos.coords.altitudeAccuracy,
                            heading: pos.coords.heading,
                            timestamp: pos.timestamp,
                            time_tracking: new Date().getTime()
                        };
                        this.events.publish('event-location-changed', this.currenLocation);
                    } else {
                        this.events.publish('event-location-changed', { error: "no location" });
                    }

                },
                    err => {
                        //console.log('error get tracking loc',err);
                        this.events.publish('event-location-changed', { error: err });
                    }
                )
    }

    stopTracking() {
        try { this.locationTracking.unsubscribe() } catch (e) { };
    }

    delay(milisecond) {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                resolve()
            }, milisecond);
        })
    }

}