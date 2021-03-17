const path = require('path');
module.exports =  {
    mode:'production',
    entry:'./src/index.js',
    output:{
        path: path.resolve(__dirname, 'dist'),
        filename: 'bundle.js',
    },
    module: {
        rules: [  
            {
                test: /\.css$/,   // 正则表达式，表示.css后缀的文件
                use: [
                    {
                        loader:'style-loader'
                    },
                    {
                        loader:'css-loader'
                    }
                    ] 
            },
            {
                test: /\.(gif|jpg|png|ico)/,
                use: [{
                    loader: 'url-loader',
                    options: {
                        limit: 500000
                    }
                }]
            }
        ]
    },
    devServer:{
        port:3000
    }
}