export class VirtualMediaDevice {
  private readonly deviceId = "photo-booth-virtual-camera-device-id";
  private readonly groupId = "photo-booth-virtual-camera-group-id";
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

  async getUserMedia(constraints: MediaStreamConstraints): Promise<MediaStream> {
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

        // https://w3c.github.io/mediacapture-main/#dom-mediadevices-getusermedia
        const res: MediaStream = await this.getUserMediaFn.call(navigator.mediaDevices, constraints);

        if (res) {
          // rewire virtual cam to our custom source
          const { width, height } = res.getTracks()[0].getSettings();
          return this.captureStream(width, height);
        }

        // otherwise, return whatever getUserMediaFn returns
        return res;
      }
    }
    return await this.getUserMediaFn.call(navigator.mediaDevices, constraints);
  }

  private captureStream(width: number, height: number): MediaStream {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");

    // use static image
    const image = new Image();
    image.onload = () => ctx.drawImage(image, 0, 0, image.width, image.height);
    image.src = "assets/tv-signal.jpg";

    // use video
    // const loop = () => {
    //   ctx.drawImage(video, 0, 0, video.width, video.height);
    //   requestAnimationFrame(loop);
    // };
    // const video = document.createElement("video");
    // video.onloadedmetadata = () => loop();
    // video.height = height;
    // video.width = width;
    // video.loop = true;
    // video.autoplay = true;
    // video.preload = "0";
    // video.src = "assets/tv-signal.mp4";

    const mediaStream = canvas["captureStream"](25) as MediaStream;

    return mediaStream.clone();
  }
}
