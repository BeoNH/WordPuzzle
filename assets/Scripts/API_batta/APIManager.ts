import { _decorator, Component, Node } from 'cc';
import Request from './Request';
const { ccclass, property } = _decorator;

@ccclass('APIManager')
export class APIManager extends Component {

    public static urlAPI: string = "https://api-tele.gamebatta.com";// batta
    public static urlSEVER: string = "https://apiwordpuzzle-tele.gamebatta.com";// sever game

    public static gameID = 70;
    public static key = 'b5ab72e6-c16e-4a7a-8e3e-49aed82bf57d';
    public static userDATA;

    public static requestData(method: string, key: string, data: any, callBack: (response: any) => void) {
        const url = APIManager.urlSEVER + key;
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
        console.log(method, "body: ", body)
        xhr.send(body);
    }

    public static CallLogin(callback) {
        let param = this;
        const url = APIManager.urlAPI + '/user-service/game/login';
        var xhr = new XMLHttpRequest();

        xhr.ontimeout = () => {
        }

        xhr.onabort = () => {
        }

        xhr.onloadend = () => {
        }

        xhr.onerror = () => {
            console.error('Request error.');
        };

        xhr.onreadystatechange = () => {
            if (xhr.readyState != 4) return;
            let response = JSON.parse(xhr.responseText);
            if (xhr.status == 200 && xhr.responseText) {

                console.log("Call=>", url, "\n", response);

                if (response.encryptedData) {
                    response = Request.decryptDataTS(response);
                    response = JSON.parse(response) || response;
                };
                response.status = xhr.status;
                APIManager.userDATA = response.data.player.player;

            } else {
                response.status = xhr.status;
            }
            callback(response);
        };
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Authorization', 'Bearer ' + APIManager.urlParam(`token`));
        xhr.setRequestHeader('game_key', APIManager.key);
        xhr.setRequestHeader("Content-type", "application/json");

        const body = JSON.stringify({
            "gameId": APIManager.gameID,
        })
        xhr.send(body);
    }

    public static urlParam(name) {
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.search);
        return (results !== null) ? results[1] || 0 : false;
    }
}