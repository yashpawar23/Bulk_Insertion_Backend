const express = require('express')
const multer = require('multer')
const path = require('path')
const fs = require('fs')
const csv = require('csv-parser')

const PORT = 8080
const app = express()
app.use(express.json())

const { cardNum } = require('./databaseConfig')


var storage = multer.diskStorage({
    destination: (req, file, cb) => {
        console.log(file, 'storage file check')
        cb(null, path.join(__dirname, 'uploads'))  // 
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname)
    }
}
)

console.log(storage, '----storage')
var upload = multer({ storage: storage })


// Function to read Excel and convert to JSON

const chunkSize = 1000

app.post('/upload', upload.single('file'), (req, res) => {

    console.log(req.file, "-----------------")

    if (!req.file) {
        return res.status(400).json({ message: 'no file upoaded' })
    }


    const filepath = path.join(__dirname, 'uploads', req.file.filename)
    console.log(filepath, "line no42")


    const jsonData = []

    try {
        fs.createReadStream(filepath)
            .pipe(csv())
            .on('error', (error) => {
                return res.status(500).json({ message: 'failed to process file', error })
            })
            .on('data', row => {
                // console.log(row,"row data from 53")
                // Only push records that match the schema (i.e., have a "Number" field)
                if (row.CardNumber) {
                    jsonData.push({ CardNumber: row.CardNumber });
                }
            })
            .on('end', async () => {

                
                if (jsonData.length === 0) {
                    return res.status(400).json({ message: 'No valid data found in the CSV file' });
                }

                try {
                    // Insert JSON data into MongoDB in chunks


                    for (let i = 0; i < jsonData.length; i += chunkSize) {
                        console.log(i, '----------------------')
                        const chunk = jsonData.slice(i, i + chunkSize);

                        console.log(chunk, "line  no 74")


                        const transformedData = jsonData.map(item => {
                            // Check if item has a CardNumber field and is a string
                            if (typeof item.CardNumber === 'string') {
                                return {
                                    firstfivedigit: item.CardNumber.slice(0, 6),   
                                    lastfourdigit: item.CardNumber.slice(-4)      
                                };
                            } else {
                                console.error("Invalid card number format:", item);
                                return null; // Return null for invalid entries to filter out later
                            }
                        })

                        console.log(transformedData,"line no 86")

                        await cardNum.insertMany(transformedData);
                    }

                    res.status(200).json({ message: 'File uploaded and data inserted successfully' });
                    
                } catch (dbError) {
                    console.error("Error inserting data into MongoDB:", dbError);
                    res.status(500).json({ message: 'Error inserting data into MongoDB', error: dbError.message });
                }
            });

    } catch (error) {
        res.status(400).json(error)
    }
})


app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`)
})

