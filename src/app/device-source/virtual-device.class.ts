export class VirtualMediaDevice {
  private readonly deviceId = "715dca83d20f15b206344f923c98cede6c4f235e0aa18b425848c0f6a8d5f5c4";
  private readonly groupId = "cb6c7f43fe34fffee0b7335c5aec9f3ac12567ef44e9b47f1bbb44a5583160ac";
  enumerateDevicesFn: Function;
  getUserMediaFn: Function;

  constructor() {
    this.enumerateDevicesFn = MediaDevices.prototype.enumerateDevices;
    this.getUserMediaFn = MediaDevices.prototype.getUserMedia;

    MediaDevices.prototype.enumerateDevices = this.enumerateDevices.bind(this);
    MediaDevices.prototype.getUserMedia = this.getUserMedia.bind(this);

    console.log("Photo Booth Virtual Camera installed.");
  }

  // https://w3c.github.io/mediacapture-main/#dom-mediadevices-enumeratedevices
  async enumerateDevices() {
    const devices: MediaDeviceInfo[] = await this.enumerateDevicesFn.call(navigator.mediaDevices);

    // https://w3c.github.io/mediacapture-main/#dom-mediadeviceinfo
    devices.push({
      deviceId: this.deviceId,
      groupId: this.groupId,
      kind: "videoinput",
      label: "Photo Booth Virtual Camera",
      toJSON() {
        return {
          deviceId: this.deviceId,
          groupId: this.groupId,
          kind: this.kind,
          label: this.label,
        };
      },
    } as MediaDeviceInfo);

    return devices;
  }

  async getUserMedia(constraints: MediaStreamConstraints) {
    const video = constraints.video as MediaTrackConstraints;
    if (video?.deviceId) {
      if (video?.deviceId === this.deviceId || video?.deviceId?.["exact"] === this.deviceId) {
        const constraints = {
          video: {
            facingMode: video.facingMode,
            advanced: video.advanced,
            width: video.width,
            height: video.height,
          },
          audio: false,
        };
        const res = await this.getUserMediaFn.call(navigator.mediaDevices, constraints);
        // if (res) {
        //   const filter = new FilterStream(res, shader);
        //   return filter.outputStream;
        // }
      }
    }
    return await this.getUserMediaFn.call(navigator.mediaDevices, constraints);
  }
}
