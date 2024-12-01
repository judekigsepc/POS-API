const { Socket } = require('socket.io')
const Product = require('../models/product.model')

//Calculates the totals provided with the cart array
const totalCalculator = (product) => {
      let total = 0
      product.forEach((product) => {
          total += product.subTotal
      })
      return total
}

//Error emitter
const errorHandler =  (socket,err) => {
      return socket.emit('error',err)
}

//Function to add to cart
const addFunc = async (socket,cart,data) => {
      if (!socket && !data && !cart) {
            return console.error(socket, 'Internal server error');     
      }
      if(!data.prodId) {
            errorHandler(socket,'No product id')
         }
         if (!data.qty) {
               data.qty = 1
         }

         const {name, price,taxes,discount,sku,_id} = await Product.findById(data.prodId)
         const goneDiscount = Number(discount)/100 * price
         const productSubTotal = ((Number(data.qty) * Number(price)) + taxes) - goneDiscount
         const product = {
               id:_id,
               name: name,
               price:price,
               subTotal:productSubTotal,
               sku: sku,
               tax:taxes,
               discount:discount,
               qty: data.qty
         }

         const exisitingProduct = cart.cartProducts.some(prod => prod.name == product.name)
         if(exisitingProduct) {
               return errorHandler(socket, 'Product already in cart')
         }
         cart.cartProducts.push(product)
         cart.cartTotal = totalCalculator(cart.cartProducts)
         
         const {cartTotal} = cart
         socket.emit('result',{product, cartTotal})
}

const updatorFunc = (socket,cart,data) => {
      //Destructure product index and index from the request
      const {prodIndex, qty} = data 

      //Check for presence and validity of the data types
      //TODO : FIX ZERO VALIDATION ISSUE
      if( !prodIndex || !qty || typeof(prodIndex) !== 'number' || typeof(qty) !== 'number') {
            return errorHandler(socket, 'Invalid data or data types in cart updater. Values should be numbers')
      }
      else if (cart.cartProducts.length == 0) {
            return errorHandler(socket, 'Your cart is empty. There is nothing to update.')
      }

      //This is a checker to check for product presence in cart using index
      const productToUpdate = cart.cartProducts[prodIndex]
      if( !productToUpdate) {
           return errorHandler(socket, 'Product not in array')
      }

      //Calculate sub total
      const subTotal = productToUpdate.price * qty;

      //Update of product alone
      [productToUpdate.qty, productToUpdate.subTotal] = [qty,subTotal]

      //Update of product in cart
      cart.cartProducts[prodIndex] = productToUpdate
      cart.cartTotal = totalCalculator(cart.cartProducts)

      const {cartTotal} = cart
      
      socket.emit('upt_result',{prodIndex, productToUpdate,cartTotal})
}

//Function to delete from cart
const deleteFunc = (socket,cart,prodIndex) => {
      //Checking product index validity
      if (!prodIndex || typeof(prodIndex) === 'string') {
            errorHandler(socket, 'Deletion Error : Invalid deletion parameter. Should be string')
      }
      //Checking product availability
      const productToDelete = cart.cartProducts[prodIndex]
      if(!productToDelete) {
            return errorHandler(socket, 'Product to delete is not in cart')
      }
      //Actual deletion
      cart.cartProducts.splice(prodIndex, 1)
      cart.cartTotal = totalCalculator(cart.cartProducts)

      const {cartTotal} = cart
      //The command
      socket.emit('delete_command',{prodIndex, cartTotal})
}

//Cart discounting function
const cartDiscounter = (socket,cart,data) => {
      const {discount,type} = data
      if (typeof(discount) !== 'number') {
           return errorHandler(socket,'Discount error: discount parameter should be number')
      }

      const resultEmmiter = () => {
            const {cartGeneralDiscount, cartTotal} = cart
            socket.emit('discount_result',{cartGeneralDiscount,cartTotal})
      }

      if(type === 'flat'){
          cart.cartTotal = cart.cartTotal - discount
          cart.cartGeneralDiscount = Number(discount)  
          
          resultEmmiter()
      }
      else if(type === 'percent') {
          cart.cartTotal = cart.cartTotal - ((Number(discount)/100) * cart.cartTotal)
          cart.cartGeneralDiscount = `${discount}%`    
          
          resultEmmiter()
      }else {
         errorHandler(socket, 'Discount error: Please check your values')
      }
      
}

const paymentComfirmFunc = (socket,cart,method) => {
      const {cartProducts,cartTotal} = cart
}

const calculateTotals = async (socket) => {
      const cart = {
            cartProducts :[],
            cartTotal: 0,
            cartGeneralDiscount:0,
      }
      
      socket.on('add_to_cart', async (data) => {
              addFunc(socket,cart,data)
      })
      socket.on('update_qty', (data) => {
            updatorFunc(socket,cart,data)
      })
      socket.on('delete_from_cart', (prodIndex) => {
             deleteFunc(socket,cart,prodIndex)
      })
      socket.on('discount_cart', (data) => {
            cartDiscounter(socket,cart,data)
      }) 
      socket.on('confirm_pay', (method) => {
            paymentComfirmFunc(socket,cart,method)
      })
}
module.exports = {calculateTotals}

