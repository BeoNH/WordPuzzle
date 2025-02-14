import { _decorator, Component, Node } from 'cc';
const { ccclass, property } = _decorator;

@ccclass('API_Test')
export class API_Test extends Component {

    public static urlAPI: string = "https://apiwordpuzzle-tele.gamebatta.com";// test

    public static requestData(key: string, data: any, callBack: (response: any) => void) {
        const url = API_Test.urlAPI + key;
        API_Test.CallPost(data, url, (response) => {
            callBack(response);
        }, (xhr) => {
            // xhr.setRequestHeader('Authorization', 'Bearer ');
            // xhr.setRequestHeader("Content-type", "application/json");
        });
    }

    public static CallPost(data, url, callback, callbackHeader) {
        let param = this;
        var xhr = new XMLHttpRequest();

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
            if (xhr.status == 201 && xhr.responseText) {
                var response = JSON.parse(xhr.responseText);
                console.log("CallPost=>", url, "\n", response);

                callback(response);
            }
        };
        xhr.open('GET', url, true);
        callbackHeader(xhr);
        let body
        if (data != null)
            body = JSON.stringify(data);
        else
            body = data
        xhr.send(body);
    }

    public static urlParam(name) {
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.search);
        return (results !== null) ? results[1] || 0 : false;
    }
}


