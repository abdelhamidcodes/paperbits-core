﻿import * as ko from "knockout";
import * as Objects from "@paperbits/common/objects";
import template from "./videoPlayerEditor.html";
import { MediaContract } from "@paperbits/common/media/mediaContract";
import { Component, OnMounted, Param, Event } from "@paperbits/common/ko/decorators";
import { VideoPlayerModel } from "../videoPlayerModel";
import { StyleService } from "@paperbits/styles/styleService";
import { IPermalinkResolver } from "@paperbits/common/permalinks";
import { SizeStylePluginConfig } from "@paperbits/styles/contracts";
import { ChangeRateLimit } from "@paperbits/common/ko/consts";

@Component({
    selector: "video-player-editor",
    template: template
})
export class VideoPlayerEditor {
    public readonly sourceUrl: ko.Observable<string>;
    public readonly controls: ko.Observable<boolean>;
    public readonly autoplay: ko.Observable<boolean>;
    public readonly appearanceStyles: ko.ObservableArray<any>;
    public readonly appearanceStyle: ko.Observable<any>;
    public readonly mimeType: string;
    public readonly sizeConfig: ko.Observable<SizeStylePluginConfig>;

    constructor(
        private readonly styleService: StyleService,
        private readonly mediaPermalinkResolver: IPermalinkResolver
    ) {
        this.sourceUrl = ko.observable<string>();
        this.controls = ko.observable<boolean>(true);
        this.autoplay = ko.observable<boolean>(false);
        this.appearanceStyles = ko.observableArray<any>();
        this.appearanceStyle = ko.observable();
        this.sizeConfig = ko.observable();
        this.mimeType = "video/mp4";
    }

    @Param()
    public model: VideoPlayerModel;

    @Event()
    public onChange: (model: VideoPlayerModel) => void;

    @OnMounted()
    public async initialize(): Promise<void> {
        let sourceUrl;

        if (this.model.sourceKey) {
            sourceUrl = await this.mediaPermalinkResolver.getUrlByTargetKey(this.model.sourceKey);
        }

        this.sourceUrl(sourceUrl);
        this.controls(this.model.controls);
        this.autoplay(this.model.autoplay);

        const sizeConfig: SizeStylePluginConfig = this.model?.styles?.instance?.size;
        this.sizeConfig(sizeConfig);

        const variations = await this.styleService.getComponentVariations("videoPlayer");

        this.appearanceStyles(variations.filter(x => x.category === "appearance"));
        this.appearanceStyle(this.model?.styles?.appearance);

        this.controls
            .extend(ChangeRateLimit)
            .subscribe(this.applyChanges);

        this.autoplay
            .extend(ChangeRateLimit)
            .subscribe(this.applyChanges);

        this.appearanceStyle
            .extend(ChangeRateLimit)
            .subscribe(this.onAppearanceChange);
    }

    public onMediaSelected(media: MediaContract): void {
        if (media) {
            this.model.sourceKey = media.key;
            this.sourceUrl(media.downloadUrl);
        }
        else {
            this.model.sourceKey = undefined;
            this.sourceUrl(null);
        }

        this.onChange(this.model);
    }

    public onSizeChange(pluginConfig: SizeStylePluginConfig): void {
        Objects.setValue(`styles/instance/size`, this.model, pluginConfig);
        this.onChange(this.model);
    }

    public onAppearanceChange(variationKey: string): void {
        Objects.setValue(`styles/appearance`, this.model, variationKey);
        this.onChange(this.model);
    }

    public applyChanges(): void {
        this.model.controls = this.controls();
        this.model.autoplay = this.autoplay();
        this.onChange(this.model);
    }
}