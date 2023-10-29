const path = require('path');
const CopyPlugin = require('copy-webpack-plugin');
const webpack = require('webpack')
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const HtmlMinimizerPlugin = require("html-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");


module.exports = {
    mode: "production",
    entry: {
        onenote2xournalpp: path.resolve(__dirname, "..", "src", "onenote2xournalpp.ts"),
        content: path.resolve(__dirname, "..", "src", "converter.ts")
    },
    output: {
        path: path.join(__dirname, "../dist"),
        filename: "[name].js",
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                loader: "ts-loader",
                exclude: /node_modules/,
            }, {
                test: /.s?css$/,
                use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
            }
        ],
    },
    optimization: {
        minimizer: [new CssMinimizerPlugin({
            exclude: [new RegExp("bg-*")]
        }), new HtmlMinimizerPlugin(), new TerserPlugin()]
    },
    plugins: [
        new CopyPlugin({
            patterns: [{from: ".", to: ".", context: "public"}]
        }),
        new webpack.ProvidePlugin({
            browser: "webextension-polyfill"
        }),

    ],
};
