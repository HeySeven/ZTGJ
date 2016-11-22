/*!
 * WeUI.js v0.2.1 (https://github.com/progrape/weui.js)
 * Copyright 2016
 * Licensed under the MIT license
 */
/**
 * Created by bearyan on 2016/2/16.
 */
(function () {
    function _validate($input) {
        var input = $input[0],
            val = $input.val();
        if (input.tagName == "INPUT" || input.tagName == "TEXTAREA") {
            var reg = input.getAttribute("required") || input.getAttribute("pattern") || "";

            if (!$input.val().length) {
                return "empty";
            } else if (reg) {
                return new RegExp(reg).test(val) ? null : "notMatch";
            } else {
                return null;
            }
        } else if (input.getAttribute("type") == "checkbox" || input.getAttribute("type") == "radio") {
            // 没有正则表达式：checkbox/radio要checked
            return input.checked ? null : "empty";
        } else if (val.length) {
            // 有输入值
            return null;
        }

        return "empty";
    }
    function _showErrorMsg(error) {
        if (error) {
            var $dom = error.$dom,
                msg = error.msg,
                tips = $dom.attr(msg + "Tips") || $dom.attr("tips") || $dom.attr("placeholder");
            if (tips) $.toptip(tips,'error');
            $dom.parents(".weui_cell").addClass("weui_cell_warn");
        }
    }

    var oldFnForm = $.fn.form;
    $.fn.form = function () {
        return this.each(function (index, ele) {
            var $form = $(ele);
            $form.find("[required]").on("blur", function () {
                var $this = $(this),
                    errorMsg;
                if ($this.val().length < 1) return; // 当空的时候不校验，以防不断弹出toptips

                errorMsg = _validate($this);
                if (errorMsg) {
                    _showErrorMsg({
                        $dom: $this,
                        msg: errorMsg
                    });
                }
            }).on("focus", function () {
                var $this = $(this);
                $this.parents(".weui_cell").removeClass("weui_cell_warn");
            });
        });
    };
    $.fn.form.noConflict = function () {
        return oldFnForm;
    };

    var oldFnValidate = $.fn.validate;
    $.fn.validate = function (callback) {
        return this.each(function () {
            var $requireds = $(this).find("[required]");
            if (typeof callback != "function") callback = _showErrorMsg;

            for (var i = 0, len = $requireds.length; i < len; ++i) {
                var $dom = $requireds.eq(i),
                    errorMsg = _validate($dom),
                    error = { $dom: $dom, msg: errorMsg };
                if (errorMsg) {
                    if (!callback(error)) _showErrorMsg(error);
                    return;
                }
            }
            callback(null);
        });
    };
    $.fn.validate.noConflict = function () {
        return oldFnValidate;
    };
})();

'use strict';

(function ($) {
    var oldFnUploader = $.fn.uploader;

    $.fn.uploader = function (options) {
        var _this = this;

        options = $.extend({
            id:'',
            title: '图片上传',
            maxCount: 4,
            compress: true,
            maxWidth: 500,
            auto: false,
            multiple:'multiple',
            url: '/upload.php',
            method: 'POST',
            accept: ['image/jpg', 'image/jpeg', 'image/png', 'image/gif'],
            headers: {},

            // event
            onChange: $.noop, // alias `onAddedFile`
            onAddedFile: $.noop,
            onRemovedfile: $.noop,
            onError: $.noop,
            onSuccess: $.noop,
            onComplete: $.noop

        }, options);

        var html = '<div class="weui_uploader">\n                        <div class="weui_uploader_hd weui_cell">\n                            <div class="weui_cell_bd weui_cell_primary">' + options.title + '</div>\n                            <div class="weui_cell_ft">0/' + options.maxCount + '</div>\n                        </div>\n                        <div class="weui_uploader_bd">\n                            <ul class="weui_uploader_files">\n                            </ul>\n                            <div class="weui_uploader_input_wrp">\n                                <input class="weui_uploader_input" id="'+options.id+'" type="file" multiple="'+options.multiple+'" accept="' + options.accept.join(',') + '">\n                            </div>\n                        </div>\n                    </div>';
        this.html(html);

        var $uploader = this;
        var $files = this.find('.weui_uploader_files');
        var $file = this.find('.weui_uploader_input');
        var blobs = [];

        /**
         * dataURI to blob, ref to https://gist.github.com/fupslot/5015897
         * @param dataURI
         */
        function dataURItoBlob(dataURI) {
            var byteString = atob(dataURI.split(',')[1]);
            var mimeString = dataURI.split(',')[0].split(':')[1].split(';')[0];
            var ab = new ArrayBuffer(byteString.length);
            var ia = new Uint8Array(ab);
            for (var i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
            }
            return new Blob([ab], { type: mimeString });
        }

        /**
         * error
         */
        function error(index) {
            var $preview = $files.find('.weui_uploader_file').eq(index);
            $preview.addClass('weui_uploader_status');
            $preview.html('<div class="weui_uploader_status_content"><i class="weui_icon_warn"></i></div>');
        }

        /**
         * success
         */
        function success(index) {
            var $preview = $files.find('.weui_uploader_file').eq(index);
            $preview.removeClass('weui_uploader_status');
            $preview.html('');
        }

        /**
         * update
         * @param msg
         */
        function update(msg) {
            var $preview = $files.find('.weui_uploader_file').last();
            $preview.addClass('weui_uploader_status');
            $preview.html('<div class="weui_uploader_status_content">' + msg + '</div>');
        }

        /**
         * 上传
         */
        function upload(file, index) {
            var fd = new FormData();
            fd.append('filename', file.name);
            fd.append('data', file.blob);
            $.ajax({
                type: options.method,
                url: options.url,
                data: fd,
                processData: false,
                contentType: false
            }).success(function (res) {
                success(index);
                options.onSuccess(res);
            }).error(function (err) {
                error(index);
                options.onError(err);
            }).always(function () {
                options.onComplete();
            });
        }

        $file.on('change', function (event) {
            var files = event.target.files;

            if (files.length === 0) {
                return;
            }
            if (blobs.length >= options.maxCount) {
                return;
            }

            $.each(files, function (idx, file) {
                var reader = new FileReader();
                reader.onload = function (e) {
                    var img = new Image();
                    img.onload = function () {
                        // 不要超出最大宽度
                        var w = options.compress ? Math.min(options.maxWidth, img.width) : img.width;
                        // 高度按比例计算
                        var h = img.height * (w / img.width);
                        var canvas = document.createElement('canvas');
                        var ctx = canvas.getContext('2d');
                        // 设置 canvas 的宽度和高度
                        canvas.width = w;
                        canvas.height = h;

                        var iphone = navigator.userAgent.match(/iPhone OS ([^\s]*)/);
                        if (iphone && iphone[1].substr(0, 1) == 7) {
                            if (img.width == 3264 && img.height == 2448) {
                                // IOS7的拍照或选照片会被莫名地压缩，所以画板要height要*2
                                ctx.drawImage(img, 0, 0, w, h * 2);
                            } else {
                                ctx.drawImage(img, 0, 0, w, h);
                            }
                        } else {
                            ctx.drawImage(img, 0, 0, w, h);
                        }

                        var dataURL = canvas.toDataURL();
                        var blob = dataURItoBlob(dataURL);
                        blobs.push({ name: file.name, blob: blob });
                        var blobUrl = URL.createObjectURL(blob);

                        $files.append('<li class="weui_uploader_file " style="background-image:url(' + blobUrl + ')"><i class="iconfont icon-icondelete"></i></li>');
                        $uploader.find('.weui_uploader_hd .weui_cell_ft').text(blobs.length + '/' + options.maxCount);

                        // trigger onAddedfile event
                        options.onAddedFile({
                            lastModified: file.lastModified,
                            lastModifiedDate: file.lastModifiedDate,
                            name: file.name,
                            size: file.size,
                            type: file.type,
                            data: dataURL, // rename to `dataURL`, data will be remove later
                            dataURL: dataURL
                        });

                        // 如果是自动上传
                        if (options.auto) {
                            upload({ name: file.name, blob: blob }, blobs.length - 1);
                        }

                        // 如果数量达到最大, 隐藏起选择文件按钮
                        if (blobs.length >= options.maxCount) {
                            $uploader.find('.weui_uploader_input_wrp').hide();
                            $('.upload-btn').hide();
                        }
                    };

                    img.src = e.target.result;
                };
                reader.readAsDataURL(file);
            });
        });

        this.on('click', '.weui_uploader_file i', function () {
            var nowDom = $(this).parent('.weui_uploader_file');
            $.confirm('确定删除该图片?', function () {
                console.log(nowDom);
                var index = nowDom.index();
                _this.remove(index);
            });
        });

        /**
         * 主动调用上传
         */
        this.upload = function () {
            // 逐个上传
            blobs.map(upload);
        };

        /**
         * 删除第 ${index} 张图片
         * @param index
         */
        this.remove = function (index) {
            var $preview = $files.find('.weui_uploader_file').eq(index);
            $preview.remove();
            blobs.splice(index, 1);
            options.onRemovedfile(index);

            // 如果数量达到最大, 隐藏起选择文件按钮
            if (blobs.length < options.maxCount) {
                //$uploader.find('.weui_uploader_input_wrp').show();
                $('.upload-btn').show();
            }
        };

        return this;
    };
    $.fn.uploader.noConflict = function () {
        return oldFnUploader;
    };
})($);