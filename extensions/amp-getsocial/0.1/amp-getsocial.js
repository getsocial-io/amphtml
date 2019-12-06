/**
 * Copyright 2019 The AMP HTML Authors. All Rights Reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS-IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {isLayoutSizeDefined} from '../../../src/layout';

export class AmpGetsocial extends AMP.BaseElement {

  /** @param {!AmpElement} element */
  constructor(element) {
    super(element);

    /** @private {string} */
    this.siteId = "";

    /** @private {string} */
    this.groupName = "";

    /** @private {?Element} */
    this.container_ = null;

    /** @private {string} */
    this.previousTrackingCode = "";
    /** @private {string} */
    this.newTrackingCode = "";
  }

  /** @override */
  buildCallback() {
    this.container_ = this.element.ownerDocument.createElement('div');

    this.siteId = this.element.getAttribute('data-site-id');
    if (!this.siteId) { return; }

    this.groupName = this.element.getAttribute('data-tool-name');

    if (this.groupName === 'dark_social_tracker') {
      const params = new URLSearchParams(location.search);

      this.previousTrackingCode = params.get('gsi') || '';

      if (!this.previousTrackingCode) {
        console.log('Direct visit');
        this.newTrackingCode = this.randomString(12);

        localStorage.setItem('gstc', this.newTrackingCode);
        params.set('gsi', this.newTrackingCode);
        history.replaceState(history.state, null, `?${params.toString()}${location.hash}`);
      } else if (localStorage.getItem('gstc') === this.previousTrackingCode) {
        this.newTrackingCode = this.previousTrackingCode;
        console.log('Page refresh');
      } else {
        this.newTrackingCode = this.randomString(12);

        localStorage.setItem('gstc', this.newTrackingCode);
        params.set('gsi', this.newTrackingCode);
        history.replaceState(history.state, null, `?${params.toString()}${location.hash}`);
        console.log('Copy and paste from ' + this.getChannel(document.referrer));
      }

      console.log(this.previousTrackingCode + ' > ' + this.newTrackingCode);

      return;
    } else {
      this.newTrackingCode = new URLSearchParams(location.search).get('gsi') || '';
    }

    this.element.appendChild(this.container_);
    this.applyFillContent(this.container_, /* replacedContent */ true);
  }

  /** @override */
  isLayoutSupported(layout) {
    return isLayoutSizeDefined(layout);
  }

  randomString(length) {
    var symbols = "qwertyuiopasdfghjklzxcvbnmQWERTYUIOPASDFGHJKLZXCVBNM1234567890",
        ret = "";

    for (var i = 0; i < length; ++i) {
      ret += symbols[Math.floor(Math.random() * symbols.length)];
    }

    return ret;
  }

  getChannel(referrer) {
    if (!referrer) {
      return 'addressbar';
    }

    try {
      var domain = new URL(referrer).hostname;

      var altDomains = {
        ok_ru: "odnoklassniki",
        t_co: "twitter",
        news_ycombinator_com: "hackernews",
        story_kakao_com: "kakaostory",
        t_umblr_com: "tumblr",
        vk_com: "vkontakte"
      };

      var ref = altDomains[domain.split(".").join("_")];
      if (ref) { return ref; }
    } catch(e) {}

    try {
      referrer = referrer.toLowerCase();

      var channels = ["facebook", "twitter", "pinterest", "reddit", "tumblr", "linkedin", "delicious",
            "odnoklassniki", "vkontakte", "buffer", "baidu", "weibo", "wechat", "renren",
            "slack", "whatsapp", "yummly", "draugiem", "flickr", "instagram", "kakaostory"],
          refChannel = "";

      for (var i = 0; i < channels.length; ++i) {
        refChannel = referrer.replace(new RegExp("(.)*\.?" + channels[i] + "\.(.)*", "gi"), channels[i]);

        if (refChannel !== referrer) { break; }
      }

      if (new RegExp(channels.join("|")).test(refChannel)) {
        return refChannel;
      }
    } catch(e) {}

    return referrer;
  }

  /** @override */
  layoutCallback() {
    console.log(this.groupName + " - layoutCallback");
    const frameUrl = `//localhost:3001/amp/0_1/${this.siteId}/${Date.now()%8**5}?t=${this.groupName}&u=${encodeURIComponent(location.href)}&c=${this.newTrackingCode}`,
          iframe = this.element.ownerDocument.createElement('iframe');

    iframe.src = frameUrl;

    this.applyFillContent(iframe, /* replacedContent */ true);
    this.container_.appendChild(iframe);

    return this.loadPromise(iframe);
  }
}

AMP.extension('amp-getsocial', '0.1', AMP => {
  AMP.registerElement('amp-getsocial', AmpGetsocial);
});
