#import pickle
#import sys

#loaded_model_d = pickle.load(open('default_model.mdl', 'rb'))
#loaded_model_nd = pickle.load(open('not_default_model.mdl', 'rb'))

#pos_prob_d = loaded_model_d.predict(mdata)
#pos_prob_nd = loaded_model_nd.predict(mdata)

#print(pos_prob_nd > pos_prob_d)



import sys, getopt, pickle

def main(argv):
   user_id = ''
   transaction_value = ''
   try:
      opts, args = getopt.getopt(argv,"hu:v:",["user_id=","transaction_value="])
   except getopt.GetoptError:
      print('transaction_approval_service.py -u <user_id> -v <transaction_value>')
      sys.exit(2)
   for opt, arg in opts:
      if opt == '-h':
         print('Usage:')
         print('transaction_approval_service.py -u <user_id> -v <transaction_value>')
         sys.exit()
      elif opt in ("-u", "--user_id"):
         user_id = arg
      elif opt in ("-v", "--transaction_value"):
         transaction_value = arg
   
   loaded_model_d = pickle.load(open('default_model.mdl', 'rb'))
   loaded_model_nd = pickle.load(open('not_default_model.mdl', 'rb'))
   
   import numpy as np
   recovered_data = np.loadtxt('test.out', delimiter=',')
   pattern = recovered_data[np.random.randint(len(recovered_data),size=1),:]
   pos_prob_nd = loaded_model_nd.predict(pattern)
   pos_prob_d = loaded_model_d.predict(pattern)
   result = pos_prob_nd > pos_prob_d
   print(result[0])
    
if __name__ == "__main__":
   main(sys.argv[1:])