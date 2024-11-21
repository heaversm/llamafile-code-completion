# Llamafile Code Completion App

This app is a demo of using [Mozilla's Llamafile](https://github.com/Mozilla-Ocho/llamafile) to do inline code completion within a web app using a free, locally running AI model.

## Getting Started

Download an AI model in Llamafile format, for example [deepseek-coder](https://huggingface.co/raincoder/deepseek-coder-1.3b-llamafile/tree/main). Make sure the model has a llamafile extension, is not an "instruct" model, and supports FIM (fill in the middle) code completion.

Then, open a terminal to wherever you downloaded your llamafile to, and run: `./[name_of_model].llamafile --nobrowser --server`.

Then run `npm install`

Then, run the development server: `npm run dev`.

Open [http://localhost:3000](http://localhost:3000) with your browser to see the app.

You can edit the app from the `app/components/CodeCompletionApp.tsx` file.

