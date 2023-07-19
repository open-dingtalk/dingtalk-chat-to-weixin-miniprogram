// pages/dingding/chat.ts
const config = {
  clientId:'ding5cuinbfeyhxniin4',
  clientSecret:'Eb1jgH-refERniX4DkTCFtsRiF6c5Jx0ltypKAG4szSeydaqIGs8jDXVppyWaLB9',
  subscriptions: [
    { type: 'EVENT', topic: '*' },
    { type: 'CALLBACK', topic: '/v1.0/im/bot/messages/get' }
  ],
  ua: '',
}
Page({
  /**
   * 页面的初始数据
   */
  data: {
    message:'ssss',
    toView: 'green',
    chatMessageList: [],
    access_token:'',
    connected:false,
    sessionWebhook:'',
    autoApply:true
  },

  upper(e) {
    console.log(e)
  },

  lower(e) {
    console.log(e)
  },

  scroll(e) {
    console.log(e)
  },

  scrollToTop() {
    this.setAction({
      scrollTop: 0
    })
  },

  bindKeyInput: function (e) {
    this.sendMessageToDingRobot(e.detail.value);
    e.detail.value = '';
  },
  
  sendMessageToDingRobot:function(content:string){
    const {connected, sessionWebhook,access_token} = this.data;
    const my = this;
    if(connected && sessionWebhook && access_token){
      const body = {
        text: {
          content: content || '钉钉,让进步发生',
        },
        msgtype: 'text',
      };
      try {
        wx.request({
          url:sessionWebhook,
          method: 'POST',
          dataType: 'json',
          data: body,
          header: {
            'x-acs-dingtalk-access-token': access_token,
          },
          success (result) {
            console.log(result)
            my.data.chatMessageList.push({
              type:0,
              user:'小微',
              text:content
            });
            my.setData({
              chatMessageList: my.data.chatMessageList
            })
          }
        });
      } catch (error) {
        console.error(error);
        throw error
      }
    }else{
      wx.showToast({
        title: '等小钉和你联系！',
        icon: 'error',
        duration: 2000
      })
      
    }
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad() {

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // 与钉钉机器人建立ws链接
    this.getDWClient();
  },

  getDWClient(){
    const my = this;
    wx.request({
      url: `https://oapi.dingtalk.com/gettoken?appkey=${config.clientId}&appsecret=${config.clientSecret}`, 
      dataType:'json',
      header: {
        'content-type': 'application/json' // 默认值
      },
      success (res) {
        if(res.data.access_token){
          my.setData({
            access_token:res.data.access_token
          });
          wx.request({
            url: `https://api.dingtalk.com/v1.0/gateway/connections/open`, 
            method: "POST",
            dataType:'json',
            header: {
              'content-type': 'application/json',
              "access-token": res.data.access_token,
              "Accept": 'application/json'
            },
            data:config,
            success (result) {
              const { endpoint, ticket } = result.data;
              if (!endpoint || !ticket) {
                throw new Error("endpoint or ticket is null");
              }
              const dw_url = `${endpoint}?ticket=${ticket}`;
              const socketTask = wx.connectSocket({
                url: dw_url,
                header:{
                  'content-type': 'application/json'
                }
              });
              socketTask.onOpen(()=>{
                my.setData({
                  connected:true
                })
              })
              socketTask.onMessage((msgData: any)=>{
                let msg = JSON.parse(msgData.data);
                switch (msg.type) {
                  case "SYSTEM":
                    if (msg.headers.topic === "disconnect") {
                      my.setData({
                        connected:false,
                        sessionWebhook:'',
                        access_token:''
                      })
                      socketTask.close({});
                      setTimeout(my.getDWClient,10);
                    } else if (msg.headers.topic === "KEEPALIVE") {
                      // my.heartbeat();
                    } else if (msg.headers.topic === "ping") {
                        let sendMsg = {
                            code : 200,
                            headers: msg.headers,
                            message : "OK",
                            data : msg.data 
                          }
                        socketTask.send({data: JSON.stringify(sendMsg)});
                    }
                    break;
                  case "EVENT":
                    my.publish("EVENT", msg.headers.topic, msg.data);
                    break;
                  case "CALLBACK":
                    // 处理机器人回调消息
                    if (msg.headers.topic === '/v1.0/im/bot/messages/get') {
                      // 注册机器人回调事件
                      console.log("收到消息");
                      const { text, sessionWebhook } = JSON.parse(msg.data);
                      if(sessionWebhook){
                        my.data.chatMessageList.push({
                          type:1,
                          user:'小钉',
                          text:text.content
                        });
                        my.setData({
                          sessionWebhook,
                          chatMessageList:my.data.chatMessageList
                        });
                        if(my.data.autoApply){
                         my.sendMessageToDingRobot('收到：'+ text.content);
                        }
                      }
                    }
                    break;
                }
              })
            },
            fail(err){
              console.error(err)
            }
          })
        }
      }
    })
  },

  publish(type:string, topic:string, value:any) {
    switch (type) {
      case "SYSTEM":
        break;
      case "EVENT":
        break;
      case "CALLBACK":

        break;
    }
  },

  isAutoChange(e){
    let checked = e.detail.value[0];
    this.setData({
      autoApply: checked === '1'
    })
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {

  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {

  }
})