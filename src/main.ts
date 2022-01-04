import Sharp from 'sharp'
import path from 'path'

class TileOptions {
    tileColumnCount?: number
    tileRowCount?: number
    segmentHeight?: number
    segmentWidth?: number
}

export async function TiledImagesGenerator(
    images: string[],
    {
        tileColumnCount = 1,
        tileRowCount = 1,
        segmentHeight = 1,
        segmentWidth = 1,
    }: TileOptions = {},
) {
    async function generateTile() {
        let rowCounter = 0
        let generatedSheetItemPath = []
        const outputPath = `${process.env.QUEUE_PROCESS_OUTPUT_FILE_PATH}/outPut.jpeg`
        const blackTemplate = `${process.env.QUEUE_PROCESS_FILE_PATH}/temporary/black-template.jpeg`

        //ساخت عکسها با سایز کوچک
        for await (let [index, item] of images.entries()) {
            const sheetItemOutputPath = `${
                process.env.QUEUE_PROCESS_RESIZED_FILE_PATH
            }/${path.basename(item)}`
            console.log('sheetItemOutputPath', sheetItemOutputPath)
            console.log('index', index)

            generatedSheetItemPath.push({
                input: sheetItemOutputPath,
                top: rowCounter * tileColumnCount,
                left: (index - rowCounter * tileColumnCount) * segmentWidth,
            })
            await Sharp(item)
                .resize(segmentWidth, segmentHeight)
                .toFile(sheetItemOutputPath)

            if ((rowCounter + 1) * tileColumnCount - 1 === index) rowCounter++
        }

        //ایجاد یک عکس خالی مشکی برای جایگذاری سگمنت ها
        await Sharp({
            create: {
                width: segmentWidth * tileColumnCount,
                height: segmentHeight * tileRowCount,
                channels: 4,
                background: { r: 0, g: 0, b: 0, alpha: 1 },
            },
        }).toFile(blackTemplate)

        await Sharp(blackTemplate)
            .composite(generatedSheetItemPath)
            .toFile(outputPath)
    }

    async function checkValues() {
        return {
            tileColumnCount,
            tileRowCount,
            segmentHeight,
            segmentWidth,
            images,
        }
    }

    return checkValues()
}

export default TiledImagesGenerator
