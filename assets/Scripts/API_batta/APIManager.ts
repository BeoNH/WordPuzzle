import { _decorator, Component, Node } from 'cc';
import Request from './Request';
const { ccclass, property } = _decorator;

export enum SERVICE_ASSETS {
    BATTA = 'batta',
    ELSA = 'elsa',
}

@ccclass('APIManager')
export class APIManager extends Component {

    public static service = SERVICE_ASSETS.ELSA;

    public static urlAPI: string = "https://api-tele.gamebatta.com";// batta
    public static urlBATTA: string = "https://apiwordpuzzle-tele.gamebatta.com";// sever game batta
    public static urlELSA: string = "https://apiwordpuzzle-mytel.elsapro.net";// sever game elsa

    public static gameID = 70;
    public static key = 'b5ab72e6-c16e-4a7a-8e3e-49aed82bf57d';
    // public static sessionID;
    public static userDATA: {
        id?: number;
        username?: string;
        [key: string]: any; // Cho phép thêm thuộc tính động nếu cần
    } = {};

    public static requestData(method: string, key: string, data: any, callBack: (response: any) => void) {
        const urlMapping: { [key in SERVICE_ASSETS]: string } = {
            [SERVICE_ASSETS.BATTA]: APIManager.urlBATTA,
            [SERVICE_ASSETS.ELSA]: APIManager.urlELSA,
        };
        const url = urlMapping[APIManager.service] + key;

        APIManager.CallRequest(method, data, url, (response) => {
            callBack(response);
        }, (xhr) => {
            // xhr.setRequestHeader('Authorization', 'Bearer ' + APIManager.urlParam(`token`));
            xhr.setRequestHeader("Content-type", "application/json");
        });
    }

    public static CallRequest(method, data, url, callback, callbackHeader) {
        let param = this;
        var xhr = new XMLHttpRequest();

        // var urlData = [];
        // if (method == "GET") {
        //     for (let k in data) {
        //         urlData.push(`${encodeURIComponent(k)}=${encodeURIComponent(data[k])}`);
        //     }
        //     url += `?${urlData.join("&")}`;
        // }

        xhr.onerror = () => {
        };

        xhr.ontimeout = () => {
        }

        xhr.onabort = () => {
        }

        xhr.onloadend = () => {
        }

        xhr.onreadystatechange = () => {
            if (xhr.readyState != 4) return;
            if (xhr.status == 200 && xhr.responseText) {
                var response = JSON.parse(xhr.responseText);
                console.log(`Call.${method}=>`, url, "\n", response);
            }
            callback(response);
        };
        xhr.open(method, url, true);
        callbackHeader(xhr);
        let body
        if (data != null)
            body = JSON.stringify(data);
        else
            body = data
        // console.log(method, "body: ", body)
        xhr.send(body);
    }

    // gọi đăng nhập Bâtta
    // public static CallLogin(callback) {
    //     let param = this;
    //     const url = APIManager.urlAPI + '/user-service/game/login';
    //     var xhr = new XMLHttpRequest();

    //     xhr.ontimeout = () => {
    //     }

    //     xhr.onabort = () => {
    //     }

    //     xhr.onloadend = () => {
    //     }

    //     xhr.onerror = () => {
    //         console.error('Request error.');
    //     };

    //     xhr.onreadystatechange = () => {
    //         if (xhr.readyState != 4) return;
    //         let response = JSON.parse(xhr.responseText);
    //         if (xhr.status == 200 && xhr.responseText) {

    //             console.log("Call=>", url, "\n", response);

    //             if (response.encryptedData) {
    //                 response = Request.decryptDataTS(response);
    //                 response = JSON.parse(response) || response;
    //             };
    //             response.status = xhr.status;
    //             APIManager.userDATA = response.data.player.player;
    //             APIManager.sessionID = response.data.sessionId;

    //         } else {
    //             response.status = xhr.status;
    //         }
    //         callback(response);
    //     };
    //     xhr.open('POST', url, true);
    //     xhr.setRequestHeader('Authorization', 'Bearer ' + APIManager.urlParam(`token`));
    //     xhr.setRequestHeader('game_key', APIManager.key);
    //     xhr.setRequestHeader("Content-type", "application/json");

    //     const body = JSON.stringify({
    //         "gameId": APIManager.gameID,
    //     })
    //     xhr.send(body);
    // }

    public static Challenge(name: string, score: number) {
        // const challenge = APIManager.urlParam(`challenge`);
        // if (challenge && challenge == 'true') {
        // }
        APIManager.requestData(`POST`, `/api/updateEventChallenge`, {
            "username": APIManager.userDATA?.username,
            "name": name,
            "score": score
            // [name]: score,
        }, res => { })
    }


    public static urlParam(name) {
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.search);
        return (results !== null) ? results[1] || 0 : false;
    }
}